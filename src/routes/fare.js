const express = require("express");
const { check } = require("express-validator");
const router = express.Router();

const { validator } = require("../middlewares/validator");
const { getTaxiFare, initDatabase } = require("../services/fare");
const locations = require("../locations.json");

const checkTaxiFareParams = [
  check("start")
    .isIn(Object.keys(locations)) //TODO: Change Location style of taxi-fare to match taxi-back
    .withMessage("출발지가 올바르지 않습니다"),
  check("goal")
    .isIn(Object.keys(locations)) //TODO: Change Location style of taxi-fare to match taxi-back
    .withMessage("도착지가 올바르지 않습니다"),
  check("time")
    .exists()
    .withMessage("날짜/시간을 입력해주세요")
    .isISO8601()
    .withMessage("날짜/시간 형식이 올바르지 않습니다"),
  validator,
];

router.get("/init", initDatabase);

router.get("/:start-:goal/time/:time", getTaxiFare);

module.exports = router;
