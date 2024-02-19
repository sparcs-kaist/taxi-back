const { buildQuests, completeQuest } = require("./quests");
const mongoose = require("mongoose");
const logger = require("../../modules/logger");

const { eventConfig } = require("../../../loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

/** 전체 퀘스트 목록입니다. */
const quests = buildQuests({
  firstLogin: {
    name: "첫 발걸음",
    description:
      "로그인만 해도 넙죽코인을 얻을 수 있다고?? 이벤트 기간에 처음으로 SPARCS Taxi 서비스에 로그인하여 넙죽코인을 받아보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_firstLogin.png",
    reward: 50,
  },
  payingAndSending: {
    name: "함께하는 택시의 여정",
    description:
      "2명 이상과 함께 택시를 타고 정산/송금까지 완료해보세요. 최대 3번까지 넙죽코인을 받을 수 있어요. 정산/송금 버튼은 채팅 페이지 좌측 하단의 <b>+버튼</b>을 눌러 확인할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_payingAndSending.png",
    reward: 150,
    maxCount: 0,
  },
  firstRoomCreation: {
    name: "첫 방 개설",
    description:
      "원하는 택시팟을 찾을 수 없다면? 원하는 조건으로 <b>방 개설 페이지</b>에서 방을 직접 개설해보세요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_firstRoomCreation.png",
    reward: 50,
  },
  roomSharing: {
    name: "너 T야? Taxi",
    description:
      "방을 공유해 친구들을 택시에 초대해보세요. 채팅창 상단의 햄버거(☰) 버튼을 누르면 <b>공유하기</b> 버튼을 찾을 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_roomSharing.png",
    reward: 50,
    isApiRequired: true,
  },
  paying: {
    name: "정산해요 택시의 숲",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 후 정산하기를 요청해보세요. 정산하기 버튼은 채팅 페이지 좌측 하단의 <b>+버튼</b>을 눌러 확인할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_paying.png",
    reward: 100,
    maxCount: 0,
  },
  sending: {
    name: "송금 완료면 I am 신뢰에요",
    description:
      "2명 이상과 함께 택시를 타고 택시비를 결제한 분께 송금해주세요. 송금하기 버튼은 채팅 페이지 좌측 하단의 <b>+버튼</b>을 눌러 확인할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_sending.png",
    reward: 50,
    maxCount: 0,
  },
  nicknameChanging: {
    name: "닉네임 폼 미쳤다",
    description:
      "닉네임을 변경하여 자신을 표현하세요. <b>마이페이지</b>의 <b>수정하기</b> 버튼을 눌러 닉네임을 수정할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_nicknameChanging.png",
    reward: 50,
  },
  accountChanging: {
    name: "계좌 등록을 해야 능률이 올라갑니다",
    description:
      "정산하기 기능을 더욱 빠르고 이용할 수 있다고? 계좌번호를 등록하면 정산하기를 할 때 계좌가 자동으로 입력돼요. <b>마이페이지</b>의 <b>수정하기</b> 버튼을 눌러 계좌번호를 등록 또는 수정할 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_accountChanging.png",
    reward: 50,
  },
  adPushAgreement: {
    name: "Taxi의 소울메이트",
    description:
      "Taxi 서비스를 잊지 않도록 가끔 찾아갈게요! 광고성 푸시 알림 수신 동의를 해주시면 방이 많이 모이는 시즌, 주변에 택시앱 사용자가 있을 때 알려드릴 수 있어요.",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_adPushAgreement.png",
    reward: 50,
  },
  eventSharing: {
    name: "너 나랑 ㅌ태태택 (1명)",
    description:
      "내가 초대한 사람이 Taxi에 가입하여 이벤트에 참여하면 넙죽코인을 드려요. 앱 내의 공유 버튼을 통해 카카오톡으로 초대 문자를 보낼 수 있어요!",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_eventSharingOnInstagram.png",
    reward: 50,
    maxCount: 0,
  },
  eventSharing5: {
    name: "너 나랑 ㅌ태태택 (5명)",
    description:
      "내가 초대한 사람이 5명이 Taxi에 가입하여 이벤트에 참여하면 넙죽코인을 드려요. 앱 내의 공유 버튼을 통해 카카오톡으로 초대 문자를 보낼 수 있어요!",
    imageUrl:
      "https://sparcs-taxi-prod.s3.ap-northeast-2.amazonaws.com/assets/event-2023fall/quest_eventSharingOnInstagram.png",
    reward: 250,
    maxCount: 0,
  },
});

/**
 * firstLogin 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @returns {Promise}
 * @usage lottery/globalState/createUserGlobalStateHandler
 */
const completeFirstLoginQuest = async (userId, timestamp) => {
  return await completeQuest(userId, timestamp, quests.firstLogin);
};

/**
 * payingAndSending 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {mongoose.Types.ObjectId} roomObject._id - 방의 ObjectId입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {Date} roomObject.time - 출발 시각입니다.
 * @returns {Promise}
 * @description 정산 요청 또는 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms - commitPaymentHandler, rooms - settlementHandler
 */
const completePayingAndSendingQuest = async (userId, timestamp, roomObject) => {
  logger.info(
    `User ${userId} requested to complete payingAndSendingQuest in Room ${roomObject._id}`
  );

  if (roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  return await completeQuest(userId, timestamp, quests.payingAndSending);
};

/**
 * firstRoomCreation 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @returns {Promise}
 * @description 방을 만들 때마다 호출해 주세요.
 * @usage rooms - createHandler
 */
const completeFirstRoomCreationQuest = async (userId, timestamp) => {
  return await completeQuest(userId, timestamp, quests.firstRoomCreation);
};

/**
 * paying 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {mongoose.Types.ObjectId} roomObject._id - 방의 ObjectId입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {Date} roomObject.time - 출발 시각입니다.
 * @returns {Promise}
 * @description 정산 요청이 이루어질 때마다 호출해 주세요.
 * @usage rooms - commitPaymentHandler
 */
const completePayingQuest = async (userId, timestamp, roomObject) => {
  logger.info(
    `User ${userId} requested to complete payingQuest in Room ${roomObject._id}`
  );

  if (roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  return await completeQuest(userId, timestamp, quests.paying);
};

/**
 * sending 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {mongoose.Types.ObjectId} roomObject._id - 방의 ObjectId입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {Date} roomObject.time - 출발 시각입니다.
 * @returns {Promise}
 * @description 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms - settlementHandler
 */
const completeSendingQuest = async (userId, timestamp, roomObject) => {
  logger.info(
    `User ${userId} requested to complete sendingQuest in Room ${roomObject._id}`
  );

  if (roomObject.part.length < 2) return null;
  if (
    !eventPeriod ||
    roomObject.time >= eventPeriod.endAt ||
    roomObject.time < eventPeriod.startAt
  )
    return null; // 택시 출발 시각이 이벤트 기간 내에 포함되지 않는 경우 퀘스트 완료 요청을 하지 않습니다.

  return await completeQuest(userId, timestamp, quests.sending);
};

/**
 * nicknameChanging 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @returns {Promise}
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 * @usage users - editNicknameHandler
 */
const completeNicknameChangingQuest = async (userId, timestamp) => {
  return await completeQuest(userId, timestamp, quests.nicknameChanging);
};

/**
 * accountChanging 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {string} newAccount - 변경된 계좌입니다.
 * @returns {Promise}
 * @description 계좌를 변경할 때마다 호출해 주세요.
 * @usage users - editAccountHandler
 */
const completeAccountChangingQuest = async (userId, timestamp, newAccount) => {
  if (newAccount === "") return null;

  return await completeQuest(userId, timestamp, quests.accountChanging);
};

/**
 * adPushAgreementQuest 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @param {boolean} advertisement - 변경된 광고성 알림 수신 동의 여부입니다.
 * @returns {Promise}
 * @description 알림 옵션을 변경할 때마다 호출해 주세요.
 * @usage notifications/editOptionsHandler
 */
const completeAdPushAgreementQuest = async (
  userId,
  timestamp,
  advertisement
) => {
  if (!advertisement) return null;

  return await completeQuest(userId, timestamp, quests.adPushAgreement);
};

/**
 * eventSharing, eventSharing5 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {number|Date} timestamp - 퀘스트 완료를 요청한 시각입니다.
 * @returns {Promise}
 * @description 초대 링크를 통해 사용자가 이벤트에 참여할 때마다, 초대한 사용자 및 초대받은 사용자에 대해 각각 호출해 주세요.
 */
const completeEventSharingQuest = async (userId, timestamp) => {
  return [
    await completeQuest(userId, timestamp, quests.eventSharing),
    await completeQuest(userId, timestamp, quests.eventSharing5),
  ];
};

module.exports = {
  quests,
  completeFirstLoginQuest,
  completePayingAndSendingQuest,
  completeFirstRoomCreationQuest,
  completePayingQuest,
  completeSendingQuest,
  completeNicknameChangingQuest,
  completeAccountChangingQuest,
  completeAdPushAgreementQuest,
  completeEventSharingQuest,
};
