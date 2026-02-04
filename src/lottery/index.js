const express = require("express");
const {
  eventStatusModel,
  questModel,
  itemModel,
  transactionModel,
  //quizModel,
} = require("./modules/stores/mongo");

const { buildResource } = require("../modules/adminResource");
const {
  addOneItemStockAction,
  addFiveItemStockAction,
} = require("./modules/items");

const { eventConfig } = require("@/loadenv");
const contracts = eventConfig && require("./modules/contracts");

// [Routes] 기존 docs 라우터의 docs extend
eventConfig && require("./routes/docs")();

// [Schedule] 스케줄러 시작
eventConfig && require("./schedules")();

const lotteryRouter = express.Router();

// [Router] APIs
lotteryRouter.use("/globalState", require("./routes/globalState"));
lotteryRouter.use("/invites", require("./routes/invites"));
lotteryRouter.use("/transactions", require("./routes/transactions"));
lotteryRouter.use("/items", require("./routes/items"));
// lotteryRouter.use("/publicNotice", require("./routes/publicNotice"));
//lotteryRouter.use("/quests", require("./routes/quests"));
//lotteryRouter.use("/quizzes", require("./routes/quizzes").default);

// [AdminJS] AdminJS에 표시할 Resource 생성
const resources =
  (eventConfig && [
    buildResource()(eventStatusModel),
    buildResource()(questModel),
    buildResource([addOneItemStockAction, addFiveItemStockAction])(itemModel),
    buildResource()(transactionModel),
    //buildResource()(quizModel),
  ]) ||
  [];

module.exports = {
  lotteryRouter,
  contracts,
  resources,
};
