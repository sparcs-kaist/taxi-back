const { eventStatusModel } = require("../modules/stores/mongo");
const {
  roomModel,
  chatModel,
  reportModel,
} = require("../../modules/stores/mongo");
const {
  notifyAbuseDetectionResultToReportChannel,
} = require("../modules/slackNotification");
const logger = require("../../modules/logger");

const { eventConfig } = require("../../../loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

/**
 * 매일 새벽 4시에 어뷰징 사용자를 감지하고, Slack을 통해 관리자에게 알림을 전송합니다.
 * Original Idea by chlehdwon
 *
 * 성능면에서 상당히 죄책감이 드는 코드이지만, 새벽에 동작하니 괜찮을 것 같습니다... :(
 */

// 두 ObjectId가 같은지 비교하는 함수
const equalsObjectId = (a) => (b) => a.equals(b);

// ObjectId의 배열에서 중복을 제거하는 함수
const removeObjectIdDuplicates = (array) => {
  return array.filter(
    (element, index) => array.findIndex(equalsObjectId(element)) === index
  );
};

// 기준 1. "기타 사유"로 신고받은 사용자
const detectReportedUsers = async (period, candidateUserIds) => {
  const reports = await reportModel.aggregate([
    {
      $match: {
        reportedId: { $in: candidateUserIds },
        type: "etc-reason",
        time: { $gte: period.startAt, $lt: period.endAt },
      },
    },
  ]);
  const reportedUserIds = removeObjectIdDuplicates(
    reports.map((report) => report.reportedId)
  );

  return { reports, reportedUserIds };
};

// 기준 2. 하루에 탑승 기록이 많은 사용자
const detectMultiplePartUsers = async (period, candidateUserIds) => {
  const rooms = await roomModel.aggregate([
    {
      $match: {
        part: { $elemMatch: { user: { $in: candidateUserIds } } }, // 방 참여자 중 후보자가 존재
        "part.1": { $exists: true }, // 방 참여자가 2명 이상
        time: { $gte: period.startAt, $lt: period.endAt },
        settlementTotal: { $gt: 0 },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            date: "$time",
            format: "%Y-%m-%d",
            timezone: "+09:00",
          },
        },
        roomIds: { $push: "$_id" },
        users: { $push: "$part.user" },
      },
    }, // 후보 방들을 날짜별로 그룹화
    {
      $project: {
        roomIds: true,
        users: {
          $reduce: {
            input: "$users",
            initialValue: [],
            in: { $concatArrays: ["$$value", "$$this"] },
          },
        },
      },
    }, // 날짜별로 방 참여자들의 목록을 병합
  ]);
  const multiplePartUserIds = removeObjectIdDuplicates(
    rooms.reduce(
      (array, { users }) =>
        array.concat(
          removeObjectIdDuplicates(users).filter(
            (userId) =>
              users.findIndex(equalsObjectId(userId)) !==
              users.findLastIndex(equalsObjectId(userId)) // 두 값이 다르면 중복된 값이 존재
          )
        ),
      []
    )
  );

  return { rooms, multiplePartUserIds };
};

// 기준 3. 채팅 개수가 5개 미만인 방에 속한 사용자
const detectLessChatUsers = async (period, candidateUserIds) => {
  const chats = await chatModel.aggregate([
    {
      $match: {
        time: { $gte: period.startAt, $lt: period.endAt },
      },
    },
    {
      $group: {
        _id: "$roomId",
        count: {
          $sum: {
            $cond: [{ $eq: ["$type", "text"] }, 1, 0], // type이 text인 경우만 count
          },
        },
      },
    }, // 채팅들을 방별로 그룹화
    {
      $match: {
        count: { $lt: 5 },
      },
    },
  ]);
  const lessChatRooms = await Promise.all(
    chats.map(async ({ _id: roomId, count }) => {
      const room = await roomModel.findById(roomId).lean();
      if (
        eventPeriod.startAt > room.time ||
        eventPeriod.endAt <= room.time ||
        room.settlementTotal <= 0
      )
        return null;

      const users = room.part
        .map((part) => part.user)
        .filter((userId) => candidateUserIds.some(equalsObjectId(userId)));
      if (users.length <= 0) return null;

      return {
        roomId,
        chatCount: count,
        users,
      };
    })
  );
  const lessChatUserIds = removeObjectIdDuplicates(
    lessChatRooms.reduce(
      (array, day) => (day ? array.concat(day.users) : array),
      []
    )
  );

  return { lessChatRooms, lessChatUserIds };
};

module.exports = async () => {
  try {
    logger.info("Abusing user detection started");

    // 오늘 자정(0시)
    const todayMidnight = new Date();
    todayMidnight.setHours(0, 0, 0, 0);

    // 어제 자정
    const yesterdayMidnight = new Date();
    yesterdayMidnight.setDate(yesterdayMidnight.getDate() - 1);
    yesterdayMidnight.setHours(0, 0, 0, 0);

    // 어제 있었던 활동을 기준으로 감지
    const period = {
      startAt: yesterdayMidnight,
      endAt: todayMidnight,
    };

    const candidateUsers = await eventStatusModel.find({}, "userId").lean();
    const candidateUserIds = candidateUsers.map((user) => user.userId);

    // 기준 1 ~ 기준 3에 각각 해당되는 사용자 목록
    const { reports, reportedUserIds } = await detectReportedUsers(
      period,
      candidateUserIds
    );
    const { rooms, multiplePartUserIds } = await detectMultiplePartUsers(
      period,
      candidateUserIds
    );
    const { lessChatRooms, lessChatUserIds } = await detectLessChatUsers(
      period,
      candidateUserIds
    );

    // 기준 1 ~ 기준 3 중 하나라도 해당되는 사용자 목록
    const abusingUsers = removeObjectIdDuplicates(
      reportedUserIds.concat(multiplePartUserIds, lessChatUserIds)
    );

    logger.info("Abusing user detection successfully finished");
    logger.info(
      `Total ${abusingUsers.length} users detected! Refer to Slack for more information`
    );

    // Slack으로 알림 전송
    notifyAbuseDetectionResultToReportChannel(
      abusingUsers,
      reports,
      reportedUserIds,
      rooms,
      multiplePartUserIds,
      lessChatRooms,
      lessChatUserIds
    );
  } catch (err) {
    logger.error(err);
    logger.error("Abusing user detection failed");
  }
};
