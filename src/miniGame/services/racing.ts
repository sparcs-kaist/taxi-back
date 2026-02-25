import { racingModel } from "../modules/mongo";
import { userModel, roomModel } from "@/modules/stores/mongo";
import { eventStatusModel } from "@/lottery/modules/stores/mongo";
import { minigameReward } from "@/lottery/modules/minigameReward";
import { emitChatEvent } from "@/modules/socket";
import { Server } from "socket.io";
import { Types } from "mongoose";
import logger from "@/modules/logger";

const racingWaitTimeouts: Map<string, NodeJS.Timeout> = new Map();

const RACING_WAIT_MS = 60 * 1000;

type RaceSpeedLog = Record<number, number[]>;

type CarResult = {
  car: number;
  finalDistanceUnits: number; // 0~1000
  finished: boolean;
  finishTick: number | null;
  retired: boolean;
  retireTick: number | null;
};

type RacingEntry = {
  userId: Types.ObjectId;
  car: number;
  amount: number;
};

const CAR_COUNT = 8;
const TRACK_END_UNITS = 1000;

// 등수별 보상 배율 (amount 기준)
const PAYOUT_MULTIPLIER_BY_RANK: Record<number, number> = {
  1: 4,
  2: 2,
  3: 1,
  4: 1,
  // 5등 이하: 0
};

const applyRacingCredit = async (delta: number, userId: Types.ObjectId) => {
  await minigameReward(delta, userId.toString(), "racing");
};

const refundRaceEntries = async (entries: RacingEntry[]) => {
  for (const e of entries) {
    const amount = Number(e.amount);
    if (amount > 0) {
      await applyRacingCredit(amount, e.userId);
    }
  }
};

const clearRacingWaitTimeout = (roomId: Types.ObjectId | string) => {
  const roomIdStr = roomId.toString();
  const timeout = racingWaitTimeouts.get(roomIdStr);
  if (timeout) clearTimeout(timeout);
  racingWaitTimeouts.delete(roomIdStr);
};

const isPlayerInRoom = async (
  roomId: Types.ObjectId,
  userId: Types.ObjectId
) => {
  const room = await roomModel.findById(roomId);
  if (!room) return { ok: false as const, error: "Room not found" };

  const participantIds = room.part.map((p) => p.user.toString());
  if (!participantIds.includes(userId.toString())) {
    return { ok: false as const, error: "Player not in room" };
  }

  return { ok: true as const };
};

const getUserNickname = async (userId: Types.ObjectId) => {
  const user = await userModel.findById(userId);
  return user?.nickname ?? "알 수 없음";
};

const getPlayerNames = async (userIds: Types.ObjectId[]) => {
  const users = await userModel.find({ _id: { $in: userIds } });
  const nameMap = new Map(users.map((u) => [u._id.toString(), u.nickname]));
  return userIds.map((id) => nameMap.get(id.toString()) ?? "알 수 없음");
};

const formatUnits = (units: number) => (units / 1000).toFixed(3);

const getRaceEntries = (race: any): RacingEntry[] => {
  return (race.entries ?? []) as RacingEntry[];
};

/**
 * waiting -> starting 전환 후 실제 경마 진행 진입
 * (중복 실행 방지 위해 status=waiting 조건으로 한 번 더 잡음)
 */
const startRacingFromWaiting = async (io: Server, roomId: Types.ObjectId) => {
  const race = await racingModel.findOne({ roomId, status: "waiting" });
  if (!race) {
    return { success: false, error: "Waiting race not found" };
  }

  if ((race.players as Types.ObjectId[]).length < 2) {
    return { success: false, error: "Not enough players" };
  }

  const startedRace = await racingModel.findOneAndUpdate(
    {
      _id: race._id,
      status: "waiting",
    },
    {
      $set: { status: "starting" },
    },
    { new: true }
  );

  if (!startedRace) {
    // 다른 요청이 먼저 시작/취소 처리했을 수 있음
    return { success: false, error: "Race already transitioned" };
  }

  clearRacingWaitTimeout(roomId);

  const playerNames = await getPlayerNames(
    startedRace.players as Types.ObjectId[]
  );

  await emitChatEvent(io, {
    roomId,
    type: "racing",
    content: `참가자가 모여 경마를 시작합니다. (${startedRace.players.length}명)\n참가자: ${playerNames.join(
      ", "
    )}`,
  });

  await runRacingGame(io, startedRace._id as Types.ObjectId);

  return { success: true };
};

/**
 * 1분 대기 타임아웃 판정
 * - 아직 waiting이고
 * - 마감시간 지났으면
 *   - 혼자면 canceled
 *   - 인원이 충분하면 시작(안전장치)
 */
const JudgeRacingWaitTimeout = async (io: Server, roomId: Types.ObjectId) => {
  const race = await racingModel.findOne({
    roomId,
    status: "waiting",
  });

  if (!race) return;

  const now = Date.now();

  // 오래된 타이머 방어
  if (now < race.waitDeadline.getTime()) {
    return;
  }

  if ((race.players as Types.ObjectId[]).length < 2) {
    race.status = "canceled";
    await race.save();

    // 원금 환급
    const entries = getRaceEntries(race);
    try {
      await refundRaceEntries(entries);
    } catch (e) {
      logger.error(`refundRaceEntries failed on cancel (${roomId}): ${e}`);
    }

    await emitChatEvent(io, {
      roomId,
      type: "racing",
      content: "1분 동안 참가자가 더 오지 않아 경마가 취소되었습니다.",
    });

    clearRacingWaitTimeout(roomId);
    return;
  }

  // 혹시 인원이 찼는데 아직 waiting이면 시작
  await startRacingFromWaiting(io, roomId);
};

/**
 * 외부에서 호출하는 단일 진입점
 * 1) room 확인
 * 2) waiting 경마방 있으면 참가
 * 3) 없으면 생성
 * 4) 생성 후 1분 대기
 * 5) 1분 내 다른 사람 오면 시작 / 아니면 canceled
 */
export const racingRoom = async (
  io: Server,
  roomId: Types.ObjectId,
  car: number,
  amount: number,
  userId: Types.ObjectId
) => {
  // 입력값 검증
  if (!Number.isInteger(car) || car < 1 || car > CAR_COUNT) {
    return {
      success: false,
      error: `car는 1~${CAR_COUNT} 사이 정수여야 합니다.`,
    };
  }
  if (!Number.isInteger(amount) || amount <= 0) {
    return { success: false, error: "amount는 1 이상의 정수여야 합니다." };
  }
  if (amount > 10000) {
    return {
      success: false,
      error: `배팅 금액은 ${10000}을 넘을 수 없습니다.`,
    };
  }

  const eventStatus = await eventStatusModel.findOne({ userId }).lean();

  if (!eventStatus) {
    return { success: false, error: "event에 참여하지 않은 사용자입니다." };
  }

  if (eventStatus.isBanned) {
    return { success: false, error: "event에서 ban된 사용자입니다." };
  }

  if (eventStatus.creditAmount < amount) {
    return {
      success: false,
      error: "본인이 가진 credit보다 더 많은 amount를 사용할 수 없습니다.",
    };
  }

  // 1) 채팅방 존재 + 참가자 체크
  const roomCheck = await isPlayerInRoom(roomId, userId);
  if (!roomCheck.ok) {
    return { success: false, error: roomCheck.error };
  }

  // 이미 starting 상태인 경마가 있으면 참여 불가
  const alreadyStarting = await racingModel.findOne({
    roomId,
    status: "starting",
  });

  if (alreadyStarting) {
    return { success: false, error: "이미 시작 중인 경마가 있습니다." };
  }

  // 2) waiting 경마방 찾기
  let race = await racingModel.findOne({
    roomId,
    status: "waiting",
  });

  // 3) 없으면 생성
  if (!race) {
    const now = new Date();
    const waitDeadline = new Date(now.getTime() + RACING_WAIT_MS);

    try {
      await applyRacingCredit(-amount, userId);
    } catch (e) {
      logger.error(
        `bet debit failed (create) room=${roomId}, user=${userId}: ${e}`
      );
      return { success: false, error: "베팅 금액 차감에 실패했습니다." };
    }

    try {
      race = await racingModel.create({
        roomId,
        status: "waiting",
        players: [userId],
        entries: [{ userId, car, amount }],
        createdAt: now,
        waitDeadline,
      });
    } catch (e) {
      // 생성 실패 시 차감 롤백
      try {
        await applyRacingCredit(amount, userId);
      } catch (rollbackErr) {
        logger.error(
          `bet debit rollback failed (create) room=${roomId}, user=${userId}: ${rollbackErr}`
        );
      }

      logger.error(
        `Racing waiting room create failed: room=${roomId}, err=${e}`
      );
      return { success: false, error: "경마 방 생성에 실패했습니다." };
    }

    logger.info(`Racing waiting room created: room=${roomId}`);

    const hostName = await getUserNickname(userId);

    await emitChatEvent(io, {
      roomId,
      type: "racing",
      content: `${hostName}님이 경마 방을 만들었습니다. 1분 내에 다른 참가자가 들어오면 시작합니다.`,
    });

    const timeoutId = setTimeout(
      JudgeRacingWaitTimeout,
      RACING_WAIT_MS,
      io,
      roomId
    );
    racingWaitTimeouts.set(roomId.toString(), timeoutId);

    return {
      success: true,
      action: "created",
      started: false,
    };
  }

  // waiting 방이 있으면 참가 로직
  const now = Date.now();

  // 대기시간 지났으면 타임아웃 처리 먼저 시도
  if (now >= race.waitDeadline.getTime()) {
    await JudgeRacingWaitTimeout(io, roomId);
    return { success: false, error: "참가 시간이 지났습니다." };
  }

  // 중복 참가 방지
  if (
    (race.players as Types.ObjectId[]).some(
      (p) => p.toString() === userId.toString()
    )
  ) {
    return { success: false, error: "이미 참가한 유저입니다." };
  }

  const entries = getRaceEntries(race);

  // 동일한 차 중복 배팅 금지
  if (entries.some((e) => Number(e.car) === car)) {
    return {
      success: false,
      error: `${car}번차는 이미 다른 참가자가 선택했습니다.`,
    };
  }

  // 선차감
  try {
    await applyRacingCredit(-amount, userId);
  } catch (e) {
    logger.error(
      `bet debit failed (join) room=${roomId}, user=${userId}: ${e}`
    );
    return { success: false, error: "베팅 금액 차감에 실패했습니다." };
  }

  (race.players as Types.ObjectId[]).push(userId);
  (race.entries as any[]).push({
    userId,
    car,
    amount,
  });

  try {
    await race.save();
  } catch (e) {
    // 저장 실패 시 차감 롤백
    try {
      await applyRacingCredit(amount, userId);
    } catch (rollbackErr) {
      logger.error(
        `bet debit rollback failed (join) room=${roomId}, user=${userId}: ${rollbackErr}`
      );
    }

    logger.error(
      `Racing join save failed: room=${roomId}, user=${userId}, err=${e}`
    );
    return { success: false, error: "경마 참가 처리에 실패했습니다." };
  }

  const joinedName = await getUserNickname(userId);

  await emitChatEvent(io, {
    roomId,
    type: "racing",
    content: `${joinedName}님이 경마 방에 참가했습니다. (차량: ${car}, 배팅: ${amount}) (${race.players.length}명)`,
  });

  // 5-1) 인원이 더 들어오면 진행
  if ((race.players as Types.ObjectId[]).length >= 2) {
    const startResult = await startRacingFromWaiting(io, roomId);

    if (!startResult.success) {
      logger.warn(
        `Failed to start racing after join (room=${roomId}, player=${userId}): ${startResult.error}`
      );
    }

    return {
      success: true,
      action: "joined",
      started: true,
    };
  }

  // 아직 미달이면 waiting 유지
  return {
    success: true,
    action: "joined",
    started: false,
  };
};

const generateRaceSpeeds = () => {
  // 1tick: 1/1000
  const TRACK_END_UNITS_LOCAL = 1000; // 1.000
  const MAX_SPEED_UNITS = 100; // 0.100

  const RETIRE_PROB = 0.015;
  const MAX_RETIRE_COUNT = 3;

  const CATCHUP_FACTOR = 0.6;
  const CATCHUP_CAP_UNITS = 80;

  const MAX_TICKS = 1000;

  const distances: number[] = Array(CAR_COUNT).fill(0);
  const retired: boolean[] = Array(CAR_COUNT).fill(false);
  let retiredCount = 0;

  const logs: RaceSpeedLog = {};
  for (let i = 1; i <= CAR_COUNT; i++) logs[i] = [];

  const randInt = (min: number, max: number): number => {
    if (max < min) return min;
    return Math.floor(Math.random() * (max - min + 1)) + min;
  };

  let finished = false;
  let tick = 0;

  while (!finished && tick < MAX_TICKS) {
    tick++;

    const activeIndexes = distances.map((_, i) => i).filter((i) => !retired[i]);
    const leaderDist =
      activeIndexes.length > 0
        ? Math.max(...activeIndexes.map((i) => distances[i]))
        : 0;

    // plannedSpeeds: -1(리타이어), 0~100(속도)
    const plannedSpeeds: number[] = Array(CAR_COUNT).fill(0);

    let activeRemaining = activeIndexes.length;

    // 1) 리타이어 / 속도 결정
    for (let i = 0; i < CAR_COUNT; i++) {
      if (retired[i]) {
        plannedSpeeds[i] = 0;
        continue;
      }

      const canRetire =
        retiredCount < MAX_RETIRE_COUNT &&
        activeRemaining > 1 &&
        distances[i] < TRACK_END_UNITS_LOCAL;

      if (canRetire && Math.random() < RETIRE_PROB) {
        retired[i] = true;
        retiredCount++;
        activeRemaining--;
        plannedSpeeds[i] = -1;
        continue;
      }

      const gapUnits = Math.max(0, leaderDist - distances[i]);
      const maxBonusUnits = Math.min(
        Math.floor(gapUnits * CATCHUP_FACTOR),
        CATCHUP_CAP_UNITS
      );

      const catchupBonusUnits = randInt(0, maxBonusUnits);
      const baseSpeedUnits = randInt(0, MAX_SPEED_UNITS - catchupBonusUnits);
      const speedUnits = baseSpeedUnits + catchupBonusUnits;

      plannedSpeeds[i] = speedUnits;
    }

    // 2) 이번 틱에 결승선 도달/초과 예정 차량 찾기
    const crossers: number[] = [];
    for (let i = 0; i < CAR_COUNT; i++) {
      const v = plannedSpeeds[i];
      if (v > 0 && distances[i] + v >= TRACK_END_UNITS_LOCAL) {
        crossers.push(i);
      }
    }

    // 3) 동시에 여러 대가 넘지 않게 처리
    if (crossers.length > 0) {
      let winner = crossers[0];
      let bestProjected = distances[winner] + plannedSpeeds[winner];

      for (let k = 1; k < crossers.length; k++) {
        const i = crossers[k];
        const projected = distances[i] + plannedSpeeds[i];

        if (projected > bestProjected) {
          winner = i;
          bestProjected = projected;
        } else if (projected === bestProjected && Math.random() < 0.5) {
          winner = i;
          bestProjected = projected;
        }
      }

      // 우승자는 정확히 1.000 도달
      plannedSpeeds[winner] = TRACK_END_UNITS_LOCAL - distances[winner];

      // 나머지는 이번 틱에 결승선 못 넘게 제한 (최대 999까지만)
      for (let i = 0; i < CAR_COUNT; i++) {
        const v = plannedSpeeds[i];
        if (i === winner || v <= 0) continue;

        const maxAllowed = TRACK_END_UNITS_LOCAL - distances[i] - 1;
        if (v > maxAllowed) {
          plannedSpeeds[i] = Math.max(0, maxAllowed);
        }
      }
    }

    // 4) 로그 기록 + 거리 반영
    for (let i = 0; i < CAR_COUNT; i++) {
      const v = plannedSpeeds[i];

      logs[i + 1].push(v === -1 ? -1 : v / 1000);

      if (v > 0) {
        distances[i] = Math.min(TRACK_END_UNITS_LOCAL, distances[i] + v);
      }
    }

    finished = distances.some((d) => d >= TRACK_END_UNITS_LOCAL);
  }

  return logs;
};

const analyzeRaceLog = (
  logs: RaceSpeedLog
): { results: CarResult[]; rankMap: Map<number, number> } => {
  const results: CarResult[] = [];

  for (let car = 1; car <= CAR_COUNT; car++) {
    const carLogs = logs[car] ?? [];
    let distUnits = 0;
    let finished = false;
    let finishTick: number | null = null;
    let retired = false;
    let retireTick: number | null = null;

    for (let i = 0; i < carLogs.length; i++) {
      const v = carLogs[i];

      if (v === -1) {
        retired = true;
        retireTick = i + 1;
        continue;
      }

      const stepUnits = Math.max(0, Math.round(v * 1000));
      distUnits = Math.min(TRACK_END_UNITS, distUnits + stepUnits);

      if (!finished && distUnits >= TRACK_END_UNITS) {
        finished = true;
        finishTick = i + 1;
      }
    }

    results.push({
      car,
      finalDistanceUnits: distUnits,
      finished,
      finishTick,
      retired,
      retireTick,
    });
  }

  // 등수 정렬 규칙
  // 1) 완주차 우선
  // 2) 완주차끼리는 finishTick 빠른 순
  // 3) 미완주차끼리는 최종 거리 긴 순
  // 4) 동률이면 리타이어 안 한 차 우선
  // 5) 둘 다 리타이어면 더 늦게 리타이어한 차 우선
  // 6) 마지막 tie-breaker: 차 번호 오름차순
  const sorted = [...results].sort((a, b) => {
    if (a.finished !== b.finished) return a.finished ? -1 : 1;

    if (a.finished && b.finished) {
      if ((a.finishTick ?? Infinity) !== (b.finishTick ?? Infinity)) {
        return (a.finishTick ?? Infinity) - (b.finishTick ?? Infinity);
      }
    } else {
      if (a.finalDistanceUnits !== b.finalDistanceUnits) {
        return b.finalDistanceUnits - a.finalDistanceUnits;
      }
    }

    if (a.retired !== b.retired) return a.retired ? 1 : -1;

    if (a.retired && b.retired && a.retireTick !== b.retireTick) {
      return (b.retireTick ?? -1) - (a.retireTick ?? -1);
    }

    return a.car - b.car;
  });

  const rankMap = new Map<number, number>();
  sorted.forEach((r, idx) => rankMap.set(r.car, idx + 1));

  return { results: sorted, rankMap };
};

const emitRaceLog = async (
  io: Server,
  roomId: Types.ObjectId,
  logs: RaceSpeedLog
) => {
  await emitChatEvent(io, {
    roomId,
    type: "raceLog",
    content: `${JSON.stringify(logs)}`,
  });
};

/**
 * waiting 종료 후 실제 경마 진행 로직
 */
const runRacingGame = async (io: Server, raceId: Types.ObjectId) => {
  try {
    const race = await racingModel.findById(raceId);
    if (!race) {
      logger.error(`runRacingGame: race not found (${raceId})`);
      return;
    }

    const roomId = race.roomId as Types.ObjectId;
    const entries = getRaceEntries(race);

    // entries가 없거나 비어있으면 종료
    if (!entries.length) {
      race.status = "finished";
      await race.save();

      await emitChatEvent(io, {
        roomId,
        type: "racing",
        content: "경마를 진행할 참가 정보가 없어 종료되었습니다.",
      });
      return;
    }

    // 참가 안내
    const userIds = entries.map((e) => e.userId);
    const users = await userModel.find({ _id: { $in: userIds } });
    const userNameMap = new Map(
      users.map((u) => [u._id.toString(), u.nickname])
    );

    const entrySummary = entries
      .map((e) => {
        const nickname = userNameMap.get(e.userId.toString()) ?? "알 수 없음";
        return `${nickname} (${e.car}번차 / ${e.amount})`;
      })
      .join(", ");

    await emitChatEvent(io, {
      roomId,
      type: "racing",
      content: `경마를 시작합니다.\n참가 내역: ${entrySummary}`,
    });

    // 1) 레이스 로그 생성
    const logs = generateRaceSpeeds();

    // 2) 로그를 채팅으로 emit
    await emitRaceLog(io, roomId, logs);

    // 3) 로그 기반 등수 계산
    const { results, rankMap } = analyzeRaceLog(logs);

    const rankingLines = results.map((r, idx) => {
      const status = r.finished
        ? `완주(${r.finishTick}틱)`
        : r.retired
          ? `리타이어(${r.retireTick}틱), 거리 ${formatUnits(r.finalDistanceUnits)}`
          : `미완주, 거리 ${formatUnits(r.finalDistanceUnits)}`;

      return `${idx + 1}등: ${r.car}번차 - ${status}`;
    });

    await emitChatEvent(io, {
      roomId,
      type: "racing",
      content: `경주 결과\n${rankingLines.join("\n")}`,
    });

    // 4) 등수 기반 보상 지급
    const rewardLines: string[] = [];

    for (const e of entries) {
      const userId = e.userId;
      const car = Number(e.car);
      const amount = Number(e.amount);

      const rank = rankMap.get(car);
      const multiplier = rank ? (PAYOUT_MULTIPLIER_BY_RANK[rank] ?? 0) : 0;

      // 이미 선차감했으므로 여기서 지급하는 값은 "총 반환액"
      const payout = Math.floor(amount * multiplier);

      const nickname = userNameMap.get(userId.toString()) ?? "알 수 없음";

      if (!rank) {
        rewardLines.push(`${nickname}: ${car}번차(유효하지 않음) -> 0 지급`);
        continue;
      }

      if (payout > 0) {
        try {
          await applyRacingCredit(payout, userId);
        } catch (e) {
          logger.error(
            `race payout failed user=${userId}, payout=${payout}: ${e}`
          );
          rewardLines.push(
            `${nickname}: ${car}번차 ${rank}등 / 배팅 ${amount} / 배율 x${multiplier} -> 지급 실패`
          );
          continue;
        }
      }

      rewardLines.push(
        `${nickname}: ${car}번차 ${rank}등 / 배팅 ${amount} / 배율 x${multiplier} -> ${payout} 지급`
      );
    }

    await emitChatEvent(io, {
      roomId,
      type: "racing",
      content: `보상 정산\n${rewardLines.join("\n")}`,
    });

    // 5) 상태 종료
    race.status = "finished";
    await race.save();
  } catch (err) {
    logger.error(`runRacingGame error (${raceId}): ${err}`);

    const race = await racingModel.findById(raceId).catch(() => null);
    if (race) {
      await emitChatEvent(io, {
        roomId: race.roomId as Types.ObjectId,
        type: "racing",
        content: "경마 진행 중 오류가 발생했습니다.",
      });

      race.status = "finished";
      await race.save().catch(() => {});
    }
  }
};
