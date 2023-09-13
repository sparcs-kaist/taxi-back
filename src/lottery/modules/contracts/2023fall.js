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

const requestPayingEvent = async () => {
  // TODO
};

const requestSendingEvent = async () => {
  // TODO
};

// 닉네임을 변경할 때마다 호출해 주세요.
const requestNicknameChangingEvent = async (userId) => {
  if (eventMode !== "2023fall") return null;

  return await eventHandler(userId, eventIds.nicknameChanging);
};

// 계좌를 변경할 때마다 호출해 주세요.
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
