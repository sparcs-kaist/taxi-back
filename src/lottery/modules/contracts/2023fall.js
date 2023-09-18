const { buildQuests, completeQuest } = require("../quests");
const mongoose = require("mongoose");

/** 전체 퀘스트 목록입니다. */
const quests = buildQuests({
  firstLogin: {
    name: "이벤트 기간 첫 로그인",
    description: "",
    imageUrl: "",
    reward: {
      ticket1: 1,
    },
  },
  payingAndSending: {
    name: "2명 이상 탑승한 방에서 정산/송금 완료",
    description: "",
    imageUrl: "",
    reward: 300,
    maxCount: 3,
  },
  firstRoomCreation: {
    name: "첫 방 개설",
    description: "",
    imageUrl: "",
    reward: 50,
  },
  roomSharing: {
    name: "방 공유하기",
    description: "",
    imageUrl: "",
    reward: 50,
  },
  paying: {
    name: "2명 이상 탑승한 방에서 정산하기",
    description: "",
    imageUrl: "",
    reward: 100,
    maxCount: 3,
  },
  sending: {
    name: "2명 이상 탑승한 방에서 송금하기",
    description: "",
    imageUrl: "",
    reward: 50,
    maxCount: 3,
  },
  nicknameChaning: {
    name: "닉네임 변경",
    description: "",
    imageUrl: "",
    reward: 50,
  },
  accountChanging: {
    name: "계좌 등록 또는 변경",
    description: "",
    imageUrl: "",
    reward: 50,
  },
  adPushAgreement: {
    name: "광고성 푸시 알림 수신 동의",
    description: "",
    imageUrl: "",
    reward: 50,
  },
  eventSharingOnInstagram: {
    name: "이벤트 인스타그램 스토리에 공유",
    description: "",
    imageUrl: "",
    reward: 100,
  },
  purchaseSharingOnInstagram: {
    name: "아이템 구매 후 인스타그램 스토리에 공유",
    description: "",
    imageUrl: "",
    reward: 100,
  },
});

const eventPeriod = {
  start: new Date("2023-09-25T00:00:00+09:00"), // Inclusive
  end: new Date("2023-10-10T00:00:00+09:00"), // Exclusive
};

/**
 * firstLogin 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 */
const completeFirstLoginQuest = async (userId) => {
  return await completeQuest(userId, eventPeriod, quests.firstLogin);
};

/**
 * payingAndSending 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이거나, 모든 참가자가 정산 또는 송금을 완료하지 않았다면 요청하지 않습니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {number} roomObject.settlementTotal - 정산 또는 송금이 완료된 참여자 수입니다.
 * @returns {Promise}
 * @description 정산 요청 또는 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms/commitPaymentHandler, rooms/settlementHandler
 */
const completePayingAndSendingQuest = async (roomObject) => {
  if (roomObject.part.length < 2) return null;
  if (roomObject.part.length > roomObject.settlementTotal) return null;

  return await Promise.all(
    roomObject.part.map(
      async (participant) =>
        await completeQuest(
          participant.user._id,
          eventPeriod,
          quests.payingAndSending
        )
    )
  );
};

/**
 * firstRoomCreation 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 방을 만들 때마다 호출해 주세요.
 * @usage rooms/createHandler
 */
const completeFirstRoomCreationQuest = async (userId) => {
  return await completeQuest(userId, eventPeriod, quests.firstRoomCreation);
};

const completeRoomSharingQuest = async () => {
  // TODO
};

/**
 * paying 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @returns {Promise}
 * @description 정산 요청이 이루어질 때마다 호출해 주세요.
 * @usage rooms/commitPaymentHandler
 */
const completePayingQuest = async (userId, roomObject) => {
  if (roomObject.part.length < 2) return null;

  return await completeQuest(userId, eventPeriod, quests.paying);
};

/**
 * sending 퀘스트의 완료를 요청합니다. 방의 참가자 수가 2명 미만이면 요청하지 않습니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @returns {Promise}
 * @description 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms/settlementHandler
 */
const completeSendingQuest = async (userId, roomObject) => {
  if (roomObject.part.length < 2) return null;

  return await completeQuest(userId, eventPeriod, quests.sending);
};

/**
 * nicknameChaning 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 * @usage users/editNicknameHandler
 */
const completeNicknameChangingQuest = async (userId) => {
  return await completeQuest(userId, eventPeriod, quests.nicknameChaning);
};

/**
 * accountChanging 퀘스트의 완료를 요청합니다.
 * @param {string|mongoose.Types.ObjectId} userId - 퀘스트를 완료한 사용자의 ObjectId입니다.
 * @param {string} newAccount - 변경된 계좌입니다.
 * @returns {Promise}
 * @description 계좌를 변경할 때마다 호출해 주세요.
 * @usage users/editAccountHandler
 */
const completeAccountChangingQuest = async (userId, newAccount) => {
  if (newAccount === "") return null;

  return await completeQuest(userId, eventPeriod, quests.accountChanging);
};

const completeAdPushAgreementQuest = async () => {
  // TODO
};

const completeEventSharingOnInstagramQuest = async (userId) => {
  return await completeQuest(
    userId,
    eventPeriod,
    quests.eventSharingOnInstagram
  );
};

const completePurchaseSharingOnInstagramQuest = async () => {
  return await completeQuest(
    userId,
    eventPeriod,
    quests.purchaseSharingOnInstagram
  );
};

module.exports = {
  quests,
  eventPeriod,
  completeFirstLoginQuest,
  completePayingAndSendingQuest,
  completeFirstRoomCreationQuest,
  completeRoomSharingQuest,
  completePayingQuest,
  completeSendingQuest,
  completeNicknameChangingQuest,
  completeAccountChangingQuest,
  completeAdPushAgreementQuest,
  completeEventSharingOnInstagramQuest,
  completePurchaseSharingOnInstagramQuest,
};
