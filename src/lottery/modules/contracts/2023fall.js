const { eventMode, eventIds } = require("../../../../loadenv");
const { eventHandler } = require("../events");

// 로그인할 때마다 호출해 주세요.
// 사용된 곳: auth/tryLogin, auth.mobile/tokenLoginHandler
const requestFirstLoginEvent = async (userId) => {
  if (eventMode !== "2023fall") return null;

  return await eventHandler(userId, eventIds.firstLogin);
};

const requestPayingAndSendingEvent = async () => {
  // TODO
};

// 방을 만들 때마다 호출해 주세요.
// 사용된 곳: rooms/createHandler
const requestFirstRoomCreation = async (userId) => {
  if (eventMode !== "2023fall") return null;

  return await eventHandler(userId, eventIds.firstRoomCreation);
};

const requestRoomSharingEvent = async () => {
  // TODO
};

// 정산 요청이 이루어질 때마다 호출해 주세요.
// 사용된 곳: rooms/commitPaymentHandler
const requestPayingEvent = async (userId, roomObject) => {
  if (eventMode !== "2023fall") return null;
  if (roomObject.part.length < 2) return null;

  return await eventHandler(userId, eventIds.paying);
};

// 송금이 이루어질 때마다 호출해 주세요.
// 사용된 곳: rooms/settlementHandler
const requestSendingEvent = async (userId, roomObject) => {
  if (eventMode !== "2023fall") return null;
  if (roomObject.part.length < 2) return null;

  return await eventHandler(userId, eventIds.sending);
};

// 닉네임을 변경할 때마다 호출해 주세요.
// 사용된 곳: users/editNicknameHandler
const requestNicknameChangingEvent = async (userId) => {
  if (eventMode !== "2023fall") return null;

  return await eventHandler(userId, eventIds.nicknameChanging);
};

// 계좌를 변경할 때마다 호출해 주세요.
// 사용된 곳: users/editAccountHandler
const requestAccountChangingEvent = async (userId) => {
  if (eventMode !== "2023fall") return null;

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
