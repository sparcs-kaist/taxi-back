const express = require("express");
const {
  eventStatusModel,
  questModel,
  itemModel,
  transactionModel,
} = require("./modules/stores/mongo");

const { buildResource } = require("../modules/adminResource");
const {
  addOneItemStockAction,
  addFiveItemStockAction,
} = require("./modules/items");

const { eventConfig } = require("../../loadenv");

// [Routes] 기존 docs 라우터의 docs extend
eventConfig && require("./routes/docs")();

const lotteryRouter = express.Router();

// [Middleware] 모든 API 요청에 대하여 origin 검증
lotteryRouter.use(require("../middlewares/originValidator"));

// [Router] APIs
lotteryRouter.use("/global-state", require("./routes/globalState"));
lotteryRouter.use("/transactions", require("./routes/transactions"));
lotteryRouter.use("/items", require("./routes/items"));
lotteryRouter.use("/public-notice", require("./routes/publicNotice"));
lotteryRouter.use("/quests", require("./routes/quests"));

// [AdminJS] AdminJS에 표시할 Resource 생성
const resources = eventConfig && [
  buildResource()(eventStatusModel),
  buildResource()(questModel),
  buildResource([addOneItemStockAction, addFiveItemStockAction])(itemModel),
  buildResource()(transactionModel),
];

const contracts =
  eventConfig && require(`./modules/contracts/${eventConfig.mode}`);

module.exports = {
  lotteryRouter,
  resources: resources ?? [],
  contracts,
};
