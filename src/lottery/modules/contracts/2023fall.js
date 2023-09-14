const { eventIds } = require("../../../../loadenv");
const { eventHandler } = require("../events");

/** 
  * @param {string} userId
  * @returns {Promise}
  * @description 로그인할 때마다 호출해 주세요.
  * @usage auth/tryLogin, auth/mobile/tokenLoginHandler
 */
const requestFirstLoginEvent = async (userId) => {
  return await eventHandler(userId, eventIds.firstLogin);
};

/**
 * 
 * @param {*} roomObject 
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
        await eventHandler(participant.user._id, eventIds.payingAndSending)
    )
  );
};

/**
 * 
 * @param {*} userId 
 * @returns {Promise}
 * @description 방을 만들 때마다 호출해 주세요.
 * @usage rooms/createHandler
 */
const requestFirstRoomCreation = async (userId) => {
  return await eventHandler(userId, eventIds.firstRoomCreation);
};

const requestRoomSharingEvent = async () => {
  // TODO
};

/**
 * 
 * @param {*} userId 
 * @param {*} roomObject 
 * @returns {Promise}
 * @description 정산 요청이 이루어질 때마다 호출해 주세요.
 * @usage rooms/commitPaymentHandler
 */
const requestPayingEvent = async (userId, roomObject) => {
  if (roomObject.part.length < 2) return null;

  return await eventHandler(userId, eventIds.paying);
};

/**
 * 
 * @param {*} userId 
 * @param {*} roomObject 
 * @returns {Promise}
 * @description 송금이 이루어질 때마다 호출해 주세요.
 * @usage rooms/settlementHandler
 */
const requestSendingEvent = async (userId, roomObject) => {
  if (roomObject.part.length < 2) return null;

  return await eventHandler(userId, eventIds.sending);
};

/**
 * 
 * @param {*} userId
 * @returns {Promise}
 * @description 닉네임을 변경할 때마다 호출해 주세요.
 * @usage users/editNicknameHandler
 */
const requestNicknameChangingEvent = async (userId) => {
  return await eventHandler(userId, eventIds.nicknameChanging);
};

/**
 * 
 * @param {*} userId 
 * @returns {Promise}
 * @description 계좌를 변경할 때마다 호출해 주세요.
 * @usage users/editAccountHandler
 */
const requestAccountChangingEvent = async (userId) => {
  return await eventHandler(userId, eventIds.accountChanging);
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
