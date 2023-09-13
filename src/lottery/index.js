const express = require("express");
const {
  eventStatusModel,
  eventModel,
  itemModel,
  transactionModel,
} = require("./modules/stores/mongo");

const { buildResource } = require("../modules/adminResource");

// [Routes] 기존 docs 라우터의 docs extend
require("./routes/docs")();

// [Middleware] 목표 달성 여부 검증
const checkReward = (req, res, next) => {
  next();
};

const lotteryRouter = express.Router();

// [Middleware] 모든 API 요청에 대하여 origin 검증
lotteryRouter.use(require("../middlewares/originValidator"));

// [Router] APIs
lotteryRouter.use("/events", require("./routes/events"));
lotteryRouter.use("/global-state", require("./routes/globalState"));
lotteryRouter.use("/transactions", require("./routes/transactions"));
lotteryRouter.use("/items", require("./routes/items"));

const resources = [
  eventStatusModel,
  eventModel,
  itemModel,
  transactionModel,
].map(buildResource());

module.exports = {
  checkReward,
  lotteryRouter,
  resources,
};
