const { buildQuests, completeQuest } = require("./quests");
const mongoose = require("mongoose");
const logger = require("@/modules/logger").default;

const { eventConfig } = require("@/loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

/** 전체 퀘스트 목록입니다. */
const quests = buildQuests({
  firstLogin: {
    name: "첫 발걸음",
    description:
      "이벤트 참여만 해도 넙죽코인을 얻을 수 있다고?? 이벤트 참여에 동의하고 넙죽코인을 받아보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_firstLogin.png",
    reward: 200,
  },
  firstRoomCreation: {
    name: "첫 방 개설",
    description:
      "원하는 택시팟을 찾을 수 없다면? 원하는 조건으로 <b>방 개설 페이지</b>에서 방을 직접 개설해 보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_firstRoomCreation.png",
    reward: 500,
  },
  roomSharing: {
    name: "4명!",
    description:
      "방을 공유해 친구들을 택시팟에 초대해 보세요. 최대 4명까지 참여할 수 있어요. 채팅창 상단의 햄버거(☰) 버튼을 누르면 <b>공유하기 버튼</b>을 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_roomSharing.png",
    reward: 500,
    isApiRequired: true,
  },
  fareSettlement: {
    name: "정산의 신, 신팍스",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 후 정산을 요청해 보세요. 정산하기 버튼은 채팅 페이지 좌측 하단의 <b>+ 버튼</b>을 눌러 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_fareSettlement.png",
    reward: 2000,
    maxCount: 0,
  },
  farePayment: {
    name: "송금 완료면 I am 신뢰에요",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 분께 송금해 주세요. 송금하기 버튼은 채팅 페이지 좌측 하단의 <b>+ 버튼</b>을 눌러 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_farePayment.png",
    reward: 2000,
    maxCount: 0,
  },
  nicknameChanging: {
    name: "닉네임 폼 미쳤다",
    description:
      "닉네임을 변경하여 자신을 표현하세요. <b>마이 페이지</b>의 <b>수정하기</b> 버튼을 눌러 닉네임을 수정할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_nicknameChanging.png",
    reward: 500,
  },
  accountChanging: {
    name: "계좌 등록을 해야 능률이 올라갑니다",
    description:
      "정산하기 기능을 더욱 빠르게 이용할 수 있다고? 계좌 번호를 등록하면 정산하기를 할 때 계좌가 자동으로 입력돼요. <b>마이 페이지</b>의 <b>수정하기</b> 버튼을 눌러 계좌 번호를 등록할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_accountChanging.png",
    reward: 500,
  },
  adPushAgreement: {
    name: "잊을만하면 찾아오는 Taxi",
    description:
      "Taxi 서비스를 잊지 않도록 가끔 찾아갈게요! 광고성 푸시 알림 수신 동의를 해주시면 방이 많이 모이는 시즌, 주변에 Taxi 앱 사용자가 있을 때 알려드릴 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_adPushAgreement.png",
    reward: 500,
  },
  eventSharing: {
    name: "Taxi를 아십니까",
    description:
      "내가 초대한 사람이 이벤트에 참여하면 넙죽코인을 드려요. 다른 사람의 초대를 받아 이벤트에 참여한 경우에도 이 퀘스트가 달성돼요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_eventSharing.png",
    reward: 700,
    maxCount: 0,
  },
  indirectEventSharing: {
    name: "코인이 복사가 된다고?",
    description:
      "내가 초대한 사람이 다른 누군가를 이벤트에 초대하면 넙죽코인을 받아요. 그 사람이 또 다른 누군가를 초대하면 또 넙죽코인을 받아요. 그 사람이 또 …",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_indirectEventSharing.png",
    reward: 300,
    maxCount: 10,
  },
  dailyAttendance: {
    name: "매일매일 출석 췤!",
    description:
      "매일 Taxi에 접속해서 <b>밸런스 게임에 참여</b>하면 하루에 한 번씩 넙죽코인을 드려요! 매일 Taxi에서 택시팟 둘러보고 넙죽코인도 받아가세요. 밸런스 게임은 23시 55분까지만 참여할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2025spring/quest_dailyAttendance.png",
    reward: 100,
    maxCount: 20,
    isApiRequired: true,
  },
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
});

/**
 * firstLogin 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
const completeFirstLoginQuest = async (sid, timestamp, url, userId) => {
  return await completeQuest(sid, timestamp, url, userId, quests.firstLogin);
};

/**
 * firstRoomCreation 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 방을 만들 때마다 호출해 주세요.
 * @usage rooms - createHandler
 */
const completeFirstRoomCreationQuest = async (sid, timestamp, url, userId) => {
  return await completeQuest(
    sid,
    timestamp,
    url,
    userId,
    quests.firstRoomCreation
  );
};

/**
 * fareSettlement 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {mongoose.Types.ObjectId} roomObject._id - 방의 ObjectId입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {Date} roomObject.time - 출발 시각입니다.
 * @returns {Promise}
 * @description 정산 요청이 이루어질 때마다 호출해 주세요.
 * @usage rooms - commitSettlementHandler
 */
const completeFareSettlementQuest = async (
  sid,
  timestamp,
  url,
  userId,
  roomObject
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

  return await completeQuest(
    sid,
    timestamp,
    url,
    userId,
    quests.fareSettlement
  );
};

/**
 * farePayment 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {mongoose.Types.ObjectId} roomObject._id - 방의 ObjectId입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {Date} roomObject.time - 출발 시각입니다.
 * @returns {Promise}
 * @description 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms - commitPaymentHandler
 */
const completeFarePaymentQuest = async (
  sid,
  timestamp,
  url,
  userId,
  roomObject
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

  return await completeQuest(sid, timestamp, url, userId, quests.farePayment);
};

/**
 * nicknameChanging 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 * @usage users - editNicknameHandler
 */
const completeNicknameChangingQuest = async (sid, timestamp, url, userId) => {
  return await completeQuest(
    sid,
    timestamp,
    url,
    userId,
    quests.nicknameChanging
  );
};

/**
 * accountChanging 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {string} newAccount - 변경된 계좌입니다.
 * @returns {Promise}
 * @description 계좌를 변경할 때마다 호출해 주세요.
 * @usage users - editAccountHandler
 */
const completeAccountChangingQuest = async (
  sid,
  timestamp,
  url,
  userId,
  newAccount
) => {
  if (newAccount === "") return null;

  return await completeQuest(
    sid,
    timestamp,
    url,
    userId,
    quests.accountChanging
  );
};

/**
 * adPushAgreement 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {boolean} advertisement - 변경된 광고성 알림 수신 동의 여부입니다.
 * @returns {Promise}
 * @description 알림 옵션을 변경할 때마다 호출해 주세요.
 * @usage notifications - editOptionsHandler
 */
const completeAdPushAgreementQuest = async (
  sid,
  timestamp,
  url,
  userId,
  advertisement
) => {
  if (!advertisement) return null;

  return await completeQuest(
    sid,
    timestamp,
    url,
    userId,
    quests.adPushAgreement
  );
};

/**
 * eventSharing 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
const completeEventSharingQuest = async (sid, timestamp, url, userId) => {
  return await completeQuest(sid, timestamp, url, userId, quests.eventSharing);
};

/**
 * indirectEventSharing 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @returns {Promise}
 * @usage lottery/globalState - createUserGlobalStateHandler
 */
const completeIndirectEventSharingQuest = async (userId, timestamp) => {
  return await completeQuest(userId, timestamp, quests.indirectEventSharing);
};

/**
 * completeAnswerCorrectlyQuest 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @returns {Promise}
 * @usage lottery/schedules/dailyQuiz - determineQuizResult
 */
export const completeAnswerCorrectlyQuest = async (userId, timestamp) => {
  return await completeQuest(userId, timestamp, quests.answerCorrectly);
};

/**
 * itemPurchase 퀘스트의 완료를 요청합니다.
 * @param {string} sid - user의 sid입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} url - 요청한 url입니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 상품을 구입할 때마다 호출해 주세요.
 */
const completeItemPurchaseQuest = async (sid, timestamp, url, userId) => {
  return await completeQuest(sid, timestamp, url, userId, quests.itemPurchase);
};

module.exports = {
  quests,
  completeFirstLoginQuest,
  completeFirstRoomCreationQuest,
  completeFareSettlementQuest,
  completeFarePaymentQuest,
  completeNicknameChangingQuest,
  completeAccountChangingQuest,
  completeAdPushAgreementQuest,
  completeEventSharingQuest,
  completeIndirectEventSharingQuest,
  completeAnswerCorrectlyQuest,
  completeItemPurchaseQuest,
};
