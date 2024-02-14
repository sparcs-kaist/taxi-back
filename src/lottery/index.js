const { eventConfig } = require("../../loadenv");

if (eventConfig) {
  // [Routes] 기존 docs 라우터의 docs extend
  require("./routes/docs")();

  const express = require("express");
  const lotteryRouter = express.Router();

  // [Middleware] 모든 API 요청에 대하여 origin 검증
  lotteryRouter.use(require("../middlewares/originValidator"));

  // [Router] APIs
  lotteryRouter.use("/globalState", require("./routes/globalState"));
  lotteryRouter.use("/transactions", require("./routes/transactions"));
  lotteryRouter.use("/items", require("./routes/items"));
  lotteryRouter.use("/publicNotice", require("./routes/publicNotice"));
  lotteryRouter.use("/quests", require("./routes/quests"));

  // [AdminJS] AdminJS에 표시할 Resource 생성
  const { buildResource } = require("../modules/adminResource");
  const {
    eventStatusModel,
    questModel,
    itemModel,
    transactionModel,
  } = require("./modules/stores/mongo");
  const {
    addOneItemStockAction,
    addFiveItemStockAction,
  } = require("./modules/items");

  const resources = [
    buildResource()(eventStatusModel),
    buildResource()(questModel),
    buildResource([addOneItemStockAction, addFiveItemStockAction])(itemModel),
    buildResource()(transactionModel),
  ];

  module.exports = {
    lotteryRouter,
    resources,
    contracts: require("./modules/contracts"),
  };
} else {
  module.exports = {
    resources: [],
  };
}
