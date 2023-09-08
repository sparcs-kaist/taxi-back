const express = require("express");

const checkReward = (req, res, next) => {
  next();
};

const lotteryRouter = express.Router();

lotteryRouter.use("/transactions", require("./routes/transactions"));

module.exports = {
  checkReward,
  lotteryRouter,
};
