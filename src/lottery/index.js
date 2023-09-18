const express = require("express");
const {
  eventStatusModel,
  questModel,
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
lotteryRouter.use("/events", require("./routes/events"));
lotteryRouter.use("/global-state", require("./routes/globalState"));
lotteryRouter.use("/items", require("./routes/items"));
<<<<<<< HEAD
lotteryRouter.use("/transactions", require("./routes/transactions"));
=======
>>>>>>> dev
lotteryRouter.use("/public-notice", require("./routes/publicNotice"));

const resources = [
  eventStatusModel,
  questModel,
  itemModel,
  transactionModel,
].map(buildResource());

const contracts = eventMode && require(`./modules/contracts/${eventMode}`);

module.exports = {
  lotteryRouter,
  resources,
  contracts,
};
