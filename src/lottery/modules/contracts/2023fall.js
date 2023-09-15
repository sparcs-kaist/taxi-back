const { eventHandler } = require("../events");
const mongoose = require("mongoose");

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 로그인할 때마다 호출해 주세요.
 * @usage auth/tryLogin, auth.mobile/tokenLoginHandler
 */
const requestFirstLoginEvent = async (userId) => {
  return await eventHandler(userId, "이벤트 기간 첫 로그인");
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
        await eventHandler(
          participant.user._id,
          "2명 이상 탑승한 방에서 정산/송금 완료"
        )
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
  return await eventHandler(userId, "첫 방 개설");
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

  return await eventHandler(userId, "2명 이상 탑승한 방에서 정산하기");
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

  return await eventHandler(userId, "2명 이상 탑승한 방에서 송금하기");
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 * @usage users/editNicknameHandler
 */
const requestNicknameChangingEvent = async (userId) => {
  return await eventHandler(userId, "닉네임 변경");
};

/**
 * @param {string|mongoose.Types.ObjectId} userId - 이벤트를 달성한 사용자의 ObjectId입니다.
 * @returns {Promise}
 * @description 계좌를 변경할 때마다 호출해 주세요.
 * @usage users/editAccountHandler
 */
const requestAccountChangingEvent = async (userId) => {
  return await eventHandler(userId, "계좌 등록 또는 수정");
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
