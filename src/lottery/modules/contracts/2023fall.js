const { eventHandler } = require("../events");
const mongoose = require("mongoose");

const events = {
  firstLogin: {
    name: "이벤트 기간 첫 로그인",
    description: "",
    imageUrl: "",
    rewardAmount: 150,
    maxCount: 1,
  },
  payingAndSending: {
    name: "2명 이상 탑승한 방에서 정산/송금 완료",
    description: "",
    imageUrl: "",
    rewardAmount: 300,
    maxCount: 3,
  },
  firstRoomCreation: {
    name: "첫 방 개설",
    description: "",
    imageUrl: "",
    rewardAmount: 50,
    maxCount: 1,
  },
  roomSharing: {
    name: "방 공유하기",
    description: "",
    imageUrl: "",
    rewardAmount: 50,
    maxCount: 1,
  },
  paying: {
    name: "2명 이상 탑승한 방에서 정산하기",
    description: "",
    imageUrl: "",
    rewardAmount: 100,
    maxCount: 3,
  },
  sending: {
    name: "2명 이상 탑승한 방에서 송금하기",
    description: "",
    imageUrl: "",
    rewardAmount: 50,
    maxCount: 3,
  },
  nicknameChaning: {
    name: "닉네임 변경",
    description: "",
    imageUrl: "",
    rewardAmount: 50,
    maxCount: 1,
  },
  accountChanging: {
    name: "계좌 등록 또는 변경",
    description: "",
    imageUrl: "",
    rewardAmount: 50,
    maxCount: 1,
  },
  adPushAgreement: {
    name: "광고성 푸시 알림 수신 동의",
    description: "",
    imageUrl: "",
    rewardAmount: 50,
    maxCount: 1,
  },
  eventSharingOnInstagram: {
    name: "이벤트 인스타그램 스토리에 공유",
    description: "",
    imageUrl: "",
    rewardAmount: 100,
    maxCount: 1,
  },
  purchaseSharingOnInstagram: {
    name: "아이템 구매 후 인스타그램 스토리에 공유",
    description: "",
    imageUrl: "",
    rewardAmount: 100,
    maxCount: 1,
  },
};

for (const [id, event] of Object.entries(events)) {
  event.id = id;
}

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 로그인할 때마다 호출해 주세요.
 * @usage auth/tryLogin, auth.mobile/tokenLoginHandler
 */
const requestFirstLoginEvent = async (userId) => {
  return await eventHandler(userId, events.firstLogin);
};

/**
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @param {number} roomObject.settlementTotal - 정산 또는 송금이 완료된 참여자 수입니다.
 * @returns {Promise}
 * @description 정산 요청 또는 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms/commitPaymentHandler, rooms/settlementHandler
 */
const requestPayingAndSendingEvent = async (roomObject) => {
  if (roomObject.part.length < 2) return null;
  if (roomObject.part.length > roomObject.settlementTotal) return null;

  return await Promise.all(
    roomObject.part.map(
      async (participant) =>
        await eventHandler(participant.user._id, events.payingAndSending)
    )
  );
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 방을 만들 때마다 호출해 주세요.
 * @usage rooms/createHandler
 */
const requestFirstRoomCreation = async (userId) => {
  return await eventHandler(userId, events.firstRoomCreation);
};

const requestRoomSharingEvent = async () => {
  // TODO
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @returns {Promise}
 * @description 정산 요청이 이루어질 때마다 호출해 주세요.
 * @usage rooms/commitPaymentHandler
 */
const requestPayingEvent = async (userId, roomObject) => {
  if (roomObject.part.length < 2) return null;

  return await eventHandler(userId, events.paying);
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @param {Object} roomObject - 방의 정보입니다.
 * @param {Array<{ user: mongoose.Types.ObjectId }>} roomObject.part - 참여자 목록입니다.
 * @returns {Promise}
 * @description 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms/settlementHandler
 */
const requestSendingEvent = async (userId, roomObject) => {
  if (roomObject.part.length < 2) return null;

  return await eventHandler(userId, events.sending);
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 * @usage users/editNicknameHandler
 */
const requestNicknameChangingEvent = async (userId) => {
  return await eventHandler(userId, events.nicknameChaning);
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 계좌를 변경할 때마다 호출해 주세요.
 * @usage users/editAccountHandler
 */
const requestAccountChangingEvent = async (userId) => {
  return await eventHandler(userId, events.accountChanging);
};

const requestAdPushAgreementEvent = async () => {
  // TODO
};

const requestEventSharingOnInstagram = async () => {
  // TODO
};

const requestPurchaseSharingOnInstagram = async () => {
  // TODO
};

module.exports = {
  events,
  requestFirstLoginEvent,
  requestPayingAndSendingEvent,
  requestFirstRoomCreation,
  requestRoomSharingEvent,
  requestPayingEvent,
  requestSendingEvent,
  requestNicknameChangingEvent,
  requestAccountChangingEvent,
  requestAdPushAgreementEvent,
  requestEventSharingOnInstagram,
  requestPurchaseSharingOnInstagram,
};
