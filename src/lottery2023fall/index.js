const express = require("express");

const checkReward = (req, res, next) => {
  next();
};

exports.default = { checkReward };
