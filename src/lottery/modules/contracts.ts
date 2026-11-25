import { buildQuests, completeQuest } from "./quests";
import logger from "@/modules/logger";
import { eventConfig } from "@/loadenv";
import type { Room } from "@/types/mongo";
import type { Types } from "mongoose";

const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

/** 전체 퀘스트 목록입니다. */
export const quests = buildQuests({
  // firstLogin: {
  //   name: "첫 발걸음",
  //   description:
  //     "이벤트 참여만 해도 넙죽코인을 얻을 수 있다고?? 이벤트 참여에 동의하고 넙죽코인을 받아보세요.",
  //   imageUrl:
  //     "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_firstLogin.png",
  //   reward: 200,
  // },
  phoneVerification: {
    name: "첫 발걸음",
    description:
      "이벤트 참여만 해도 넙죽코인을 얻을 수 있다고?? 전화번호를 인증해서 넙죽코인을 받아보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025fall/quest_phoneVerification.png",
    reward: 500,
    maxCount: 1,
  },
  firstRoomCreation: {
    name: "첫 방 개설",
    description:
      "원하는 택시팟을 찾을 수 없다면? 원하는 조건으로 <b>방 개설 페이지</b>에서 방을 직접 개설해 보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_firstRoomCreation.png",
    reward: 1000,
    maxCount: 1,
  },
  // roomSharing: {
  //   name: "4명!",
  //   description:
  //     "방을 공유해 친구들을 택시팟에 초대해 보세요. 최대 4명까지 참여할 수 있어요. 채팅창 상단의 햄버거(☰) 버튼을 누르면 <b>공유하기 버튼</b>을 찾을 수 있어요.",
  //   imageUrl:
  //     "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_roomSharing.png",
  //   reward: 500,
  //   isApiRequired: true,
  // },
  accountChanging: {
    name: "계좌 등록을 해야 능률이 올라갑니다",
    description:
      "정산하기 기능을 더욱 빠르게 이용할 수 있다고? 계좌 번호를 등록하면 정산하기를 할 때 계좌가 자동으로 입력돼요. <b>마이 페이지</b>의 <b>수정하기</b> 버튼을 눌러 계좌 번호를 등록할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_accountChanging.png",
    reward: 200,
    maxCount: 1,
  },
  adPushAgreement: {
    name: "잊을만하면 찾아오는 Taxi",
    description:
      "Taxi 서비스를 잊지 않도록 가끔 찾아갈게요! 광고성 푸시 알림 수신 동의를 해주시면 방이 많이 모이는 시즌, 주변에 Taxi 앱 사용자가 있을 때 알려드릴 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_adPushAgreement.png",
    reward: 500,
    maxCount: 1,
  },
  // eventSharing: {
  //   name: "Taxi를 아십니까",
  //   description:
  //     "내가 초대한 사람이 이벤트에 참여하면 넙죽코인을 드려요. 다른 사람의 초대를 받아 이벤트에 참여한 경우에도 이 퀘스트가 달성돼요.",
  //   imageUrl:
  //     "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_eventSharing.png",
  //   reward: 20,
  //   maxCount: 0,
  // },
  // dailyAttendance: {
  //   name: "매일매일 출석 췤!",
  //   description:
  //     "매일 Taxi에 접속해서 <b>밸런스 게임에 참여</b>하면 하루에 한 번씩 넙죽코인을 드려요! 매일 Taxi에서 택시팟 둘러보고 넙죽코인도 받아가세요. 밸런스 게임은 23시 55분까지만 참여할 수 있어요.",
  //   imageUrl:
  //     "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_dailyAttendance.png",
  //   reward: 100,
  //   maxCount: 20,
  //   isApiRequired: true,
  // },
  /*
  answerCorrectly: {
    name: "이기는 편 우리 편",
    description:
      "전날의 밸런스 게임에서 응답자 수가 많은 선택지를 고른 경우 추가 넙죽코인을 드려요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_answerCorrectly.png",
    reward: 600,
    maxCount: 20,
  },
  itemPurchase: {
    name: "Taxi에서 산 응모권",
    description:
      "응모권 교환소에서 아무 경품 응모권이나 구매해 보세요. Taxi에서 판매하는 응모권은 모두 정품이니 안심해도 좋아요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_itemPurchase.png",
    reward: 500,
  },
  */
  //2025 가을 이벤트 코드입니다.
  fareSettlement: {
    name: "정산의 신, 신팍스",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 후 정산을 요청해 보세요. 정산하기 버튼은 채팅 페이지 좌측 하단의 <b>+ 버튼</b>을 눌러 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_fareSettlement.png",
    reward: 1000,
    maxCount: 0,
  },
  farePayment: {
    name: "송금 완료... 을!",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 분께 송금해 주세요. 송금하기 버튼은 채팅 페이지 좌측 하단의 <b>+ 버튼</b>을 눌러 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_farePayment.png",
    reward: 1000,
    maxCount: 0,
  },
  nicknameChanging: {
    name: "닉네임 폼 미쳤다",
    description:
      "닉네임을 변경하여 자신을 표현하세요. <b>마이 페이지</b>의 <b>수정하기</b> 버튼을 눌러 닉네임을 수정할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_nicknameChanging.png",
    reward: 200,
    maxCount: 1,
  },
  // allBadgedSettlement: {
  //   name: "동승자 안심돼서 응모권 낳음",
  //   description:
  //     "방의 모든 인원이 인증 뱃지를 보유한 상태에서 정산하면 강화 재화를 받아요. (1일 최대 1회)",
  //   imageUrl:
  //     "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025fall/quest_allBadgedSettlement.png",
  //   reward: 1000,
  //   maxCount: 0,
  // },
  referralInviterCredit: {
    name: "친구 초대 보상(초대한 사람)",
    description: "초대한 친구가 전화번호 인증을 완료하면 코인을 받아요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_eventSharing.png",
    reward: 500,
    maxCount: 0, // 여러 명 초대 가능
  },
  referralInviteeCredit: {
    name: "초대 인증 보상(초대받은 사람)",
    description: "초대 링크로 참여해 전화번호 인증을 완료하면 코인을 받아요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_eventSharing.png",
    reward: 500,
    maxCount: 1, // 본인 1회
  },
  indirectEventSharing: {
    name: "코인이 복사가 된다고?",
    description:
      "내가 초대한 사람이 다른 누군가를 이벤트에 초대하면 코인을 받아요. 그 사람이 또 다른 누군가를 초대하면 또 코인을 받아요. 그 사람이 또 …",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_indirectEventSharing.png",
    reward: 200,
    maxCount: 0,
  },
  firstReinforcement: {
    name: "대장장이 데뷔",
    description: "택시를 처음으로 강화해보세요! 드림카를 향해서...!",
    imageUrl:
      "https://taxi.cdn.sparcs.org/assets/event-2026spring/reinforcement.png",
    reward: 500,
    maxCount: 1,
  },
  firstMiniGame: {
    name: "똥피하기 운동 많이 된다",
    description:
      "미니게임을 처음 플레이해 보세요. 미니게임은 <b>강화 페이지</b>에서 할 수 있어요",
    imageUrl:
      "https://taxi.cdn.sparcs.org/assets/event-2026spring/minigame.png",
    reward: 500,
    maxCount: 1,
  },
  useCoupon1: {
    name: "해오름식 쿠폰!",
    description:
      "해오름식에서 받은 쿠폰 코드를 사용해 보세요. 쿠폰은 <b>안내 페이지</b>에서 사용할 수 있어요.",
    imageUrl:
      "https://taxi.cdn.sparcs.org/assets/event-2026spring/80b13c485f831d19.png",
    reward: 1000,
    maxCount: 1,
  },
  useCoupon2: {
    name: "오픈 동방 쿠폰!",
    description:
      "오픈 동방에서 받은 쿠폰 코드를 사용해 보세요. 쿠폰은 <b>안내 페이지</b>에서 사용할 수 있어요.",
    imageUrl:
      "https://taxi.cdn.sparcs.org/assets/event-2026spring/ba74aadbae80eb5f.png",
    reward: 1000,
    maxCount: 1,
  },
});

/**
 * phoneVerification 퀘스트의 완료를 요청합니다.
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
export const completePhoneVerificationQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.phoneVerification);

/**
 * ReferralInviter 퀘스트의 완료를 요청합니다.
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
export const completeReferralInviterCredit = async (
  inviterId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(inviterId, timestamp, quests!.referralInviterCredit);

/**
 * ReferralInvitee 퀘스트의 완료를 요청합니다.
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
export const completeReferralInviteeCredit = async (
  inviteeId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(inviteeId, timestamp, quests!.referralInviteeCredit);

/**
 * firstRoomCreation 퀘스트의 완료를 요청합니다.
 * @description 방을 만들 때마다 호출해 주세요.
 */
export const completeFirstRoomCreationQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.firstRoomCreation);

/**
 * fareSettlement 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @description 정산 요청이 이루어질 때마다 호출해 주세요.
 */
export const completeFareSettlementQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date,
  roomObject: Room
) => {
  logger.info(
    `User ${userId} requested to complete fareSettlementQuest in Room ${roomObject._id}`
  );

  if (roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  return await completeQuest(userId, timestamp, quests!.fareSettlement);
};

/**
 * farePayment 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @description 송금이 이루어질 때마다 호출해 주세요.
 */
export const completeFarePaymentQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date,
  roomObject: Room
) => {
  logger.info(
    `User ${userId} requested to complete farePaymentQuest in Room ${roomObject._id}`
  );

  if (roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  return await completeQuest(userId, timestamp, quests!.farePayment);
};

/**
 * nicknameChanging 퀘스트의 완료를 요청합니다.
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 */
export const completeNicknameChangingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.nicknameChanging);

/**
 * accountChanging 퀘스트의 완료를 요청합니다.
 * @description 계좌를 변경할 때마다 호출해 주세요.
 */
export const completeAccountChangingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date,
  newAccount: string
) => {
  if (newAccount === "") return null;
  return await completeQuest(userId, timestamp, quests!.accountChanging);
};

/**
 * adPushAgreement 퀘스트의 완료를 요청합니다.
 * @description 알림 옵션을 변경할 때마다 호출해 주세요.
 */
export const completeAdPushAgreementQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date,
  advertisement: boolean
) => {
  if (!advertisement) return null;
  return await completeQuest(userId, timestamp, quests!.adPushAgreement);
};

/**
 * indirectEventSharing 퀘스트의 완료를 요청합니다.
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
export const completeIndirectEventSharingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.indirectEventSharing);

/**
 * firstReinforcement 퀘스트의 완료를 요청합니다.
 * @usage miniGame - reinforcementHandler
 */
export const completeFirstReinforcementQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.firstReinforcement);

/**
 * firstMiniGame 퀘스트의 완료를 요청합니다.
 * @usage miniGame - updateCreditHandler
 */
export const completeFirstMinigameQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.firstMiniGame);

/**
 * useCoupon1 퀘스트의 완료를 요청합니다.
 * @usage items - useCouponHandler
 */
export const completeUseCoupon1Quest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.useCoupon1);

/**
 * useCoupon2 퀘스트의 완료를 요청합니다.
 * @usage items - useCouponHandler
 */
export const completeUseCoupon2Quest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.useCoupon2);

// 아래 퀘스트 완료 함수들은 현재 이벤트에서 사용되지 않습니다.
/*
export const completeFirstLoginQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.firstLogin);

export const completeEventSharingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.eventSharing);

//2025 가을 이벤트에서는 퀴즈가 없습니다.
export const completeAnswerCorrectlyQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.answerCorrectly);

export const completeItemPurchaseQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => await completeQuest(userId, timestamp, quests!.itemPurchase);
*/
