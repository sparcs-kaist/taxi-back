const express = require("express");
const {
  eventStatusModel,
  eventModel,
  itemModel,
  transactionModel,
} = require("./modules/stores/mongo");

const { eventMode } = require("../../loadenv");
const { buildResource } = require("../modules/adminResource");

// [Routes] 기존 docs 라우터의 docs extend
require("./routes/docs")();

const lotteryRouter = express.Router();

// [Middleware] 모든 API 요청에 대하여 origin 검증
lotteryRouter.use(require("../middlewares/originValidator"));

// [Router] APIs
lotteryRouter.use("/global-state", require("./routes/globalState"));
lotteryRouter.use("/transactions", require("./routes/transactions"));
lotteryRouter.use("/items", require("./routes/items"));

const resources = [
  eventStatusModel,
  eventModel,
  itemModel,
  transactionModel,
].map(buildResource());

const contracts = eventMode && require(`./modules/contracts/${eventMode}`);

module.exports = {
  lotteryRouter,
  resources,
  contracts,
};
