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
  firstLogin: {
    name: "첫 발걸음",
    description:
      "이벤트 참여만 해도 넙죽코인을 얻을 수 있다고?? 이벤트 참여에 동의하고 넙죽코인을 받아보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_firstLogin.png",
    reward: { credit: 200 },
  },
  firstRoomCreation: {
    name: "첫 방 개설",
    description:
      "원하는 택시팟을 찾을 수 없다면? 원하는 조건으로 <b>방 개설 페이지</b>에서 방을 직접 개설해 보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_firstRoomCreation.png",
    reward: { credit: 500 },
  },
  roomSharing: {
    name: "4명!",
    description:
      "방을 공유해 친구들을 택시팟에 초대해 보세요. 최대 4명까지 참여할 수 있어요. 채팅창 상단의 햄버거(☰) 버튼을 누르면 <b>공유하기 버튼</b>을 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_roomSharing.png",
    reward: { credit: 500 },
    isApiRequired: true,
  },
  fareSettlement: {
    name: "정산의 신, 신팍스",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 후 정산을 요청해 보세요. 정산하기 버튼은 채팅 페이지 좌측 하단의 <b>+ 버튼</b>을 눌러 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_fareSettlement.png",
    reward: { credit: 2000 },
    maxCount: 0,
  },
  farePayment: {
    name: "송금 완료면 I am 신뢰에요",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 분께 송금해 주세요. 송금하기 버튼은 채팅 페이지 좌측 하단의 <b>+ 버튼</b>을 눌러 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_farePayment.png",
    reward: { credit: 2000 },
    maxCount: 0,
  },
  nicknameChanging: {
    name: "닉네임 폼 미쳤다",
    description:
      "닉네임을 변경하여 자신을 표현하세요. <b>마이 페이지</b>의 <b>수정하기</b> 버튼을 눌러 닉네임을 수정할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_nicknameChanging.png",
    reward: { credit: 500 },
  },
  accountChanging: {
    name: "계좌 등록을 해야 능률이 올라갑니다",
    description:
      "정산하기 기능을 더욱 빠르게 이용할 수 있다고? 계좌 번호를 등록하면 정산하기를 할 때 계좌가 자동으로 입력돼요. <b>마이 페이지</b>의 <b>수정하기</b> 버튼을 눌러 계좌 번호를 등록할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_accountChanging.png",
    reward: { credit: 500 },
  },
  adPushAgreement: {
    name: "잊을만하면 찾아오는 Taxi",
    description:
      "Taxi 서비스를 잊지 않도록 가끔 찾아갈게요! 광고성 푸시 알림 수신 동의를 해주시면 방이 많이 모이는 시즌, 주변에 Taxi 앱 사용자가 있을 때 알려드릴 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_adPushAgreement.png",
    reward: { credit: 500 },
  },
  eventSharing: {
    name: "Taxi를 아십니까",
    description:
      "내가 초대한 사람이 이벤트에 참여하면 넙죽코인을 드려요. 다른 사람의 초대를 받아 이벤트에 참여한 경우에도 이 퀘스트가 달성돼요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_eventSharing.png",
    reward: { credit: 700 },
    maxCount: 0,
  },
  indirectEventSharing: {
    name: "코인이 복사가 된다고?",
    description:
      "내가 초대한 사람이 다른 누군가를 이벤트에 초대하면 넙죽코인을 받아요. 그 사람이 또 다른 누군가를 초대하면 또 넙죽코인을 받아요. 그 사람이 또 …",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_indirectEventSharing.png",
    reward: { credit: 300 },
    maxCount: 10,
  },
  dailyAttendance: {
    name: "매일매일 출석 췤!",
    description:
      "매일 Taxi에 접속해서 <b>밸런스 게임에 참여</b>하면 하루에 한 번씩 넙죽코인을 드려요! 매일 Taxi에서 택시팟 둘러보고 넙죽코인도 받아가세요. 밸런스 게임은 23시 55분까지만 참여할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_dailyAttendance.png",
    reward: { credit: 100 },
    maxCount: 20,
    isApiRequired: true,
  },
  answerCorrectly: {
    name: "이기는 편 우리 편",
    description:
      "전날의 밸런스 게임에서 응답자 수가 많은 선택지를 고른 경우 추가 넙죽코인을 드려요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_answerCorrectly.png",
    reward: { credit: 600 },
    maxCount: 20,
  },
  itemPurchase: {
    name: "Taxi에서 산 응모권",
    description:
      "응모권 교환소에서 아무 경품 응모권이나 구매해 보세요. Taxi에서 판매하는 응모권은 모두 정품이니 안심해도 좋아요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_itemPurchase.png",
    reward: { credit: 500 },
  },
});

/**
 * firstLogin 퀘스트의 완료를 요청합니다.
 */
export const completeFirstLoginQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("Quest is empty");
    return null;
  } else {
    return await completeQuest(userId, timestamp, quests.firstLogin);
  }
};

/**
 * firstRoomCreation 퀘스트의 완료를 요청합니다.
 * @description 방을 만들 때마다 호출해 주세요.
 */
export const completeFirstRoomCreationQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("quests is empty");
    return null;
  } else {
    return await completeQuest(userId, timestamp, quests.firstRoomCreation);
  }
};

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

  if (roomObject.part && roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  if (!quests) {
    logger.info("quests is empty");
    return null;
  } else {
    return await completeQuest(userId, timestamp, quests.fareSettlement);
  }
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

  if (roomObject.part && roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  if (!quests) {
    logger.info("quests is empty");
    return null;
  } else {
    return await completeQuest(userId, timestamp, quests.farePayment);
  }
};

/**
 * nicknameChanging 퀘스트의 완료를 요청합니다.
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 */
export const completeNicknameChangingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("quests is empty");
    return null;
  } else {
    return await completeQuest(userId, timestamp, quests.nicknameChanging);
  }
};

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
  if (!quests) {
    logger.info("quests is empty");
    return null;
  } else {
    return await completeQuest(userId, timestamp, quests.accountChanging);
  }
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
  if (!quests) {
    logger.info("quests is empty");
    return null;
  }

  return await completeQuest(userId, timestamp, quests.adPushAgreement);
};

/**
 * eventSharing 퀘스트의 완료를 요청합니다.
 * @returns
 */
export const completeEventSharingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("quests.eventSharing is empty");
    return null;
  }
  return await completeQuest(userId, timestamp, quests.eventSharing);
};

/**
 * indirectEventSharing 퀘스트의 완료를 요청합니다.
 */
export const completeIndirectEventSharingQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("quests.indirectEventSharing is empty");
    return null;
  }
  return await completeQuest(userId, timestamp, quests.indirectEventSharing);
};

/**
 * completeAnswerCorrectlyQuest 퀘스트의 완료를 요청합니다.
 */
export const completeAnswerCorrectlyQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("quests.answerCorrectly is empty");
    return null;
  }
  return await completeQuest(userId, timestamp, quests.answerCorrectly);
};

/**
 * itemPurchase 퀘스트의 완료를 요청합니다.
 * @description 상품을 구입할 때마다 호출해 주세요.
 */
export const completeItemPurchaseQuest = async (
  userId: string | Types.ObjectId,
  timestamp: number | Date
) => {
  if (!quests) {
    logger.info("quests.itemPurchase is empty");
    return null;
  }
  return await completeQuest(userId, timestamp, quests.itemPurchase);
};
