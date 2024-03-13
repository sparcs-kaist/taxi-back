const express = require("express");
const { query } = require("express-validator");
const router = express.Router();

const validator = require("../middlewares/validator");
const { getTaxiFare, initDatabase } = require("../services/fare");
const { locationModel } = require("../modules/stores/mongo");

router.get("/init", initDatabase);

router.get(
  "/getTaxiFare",
  async (req, res, next) => {
    req.locations = (
      await locationModel.find({ isValid: { $ne: false } }, "_id")
    ).map((location) => location._id);
    next();
  },
  query("start").custom((value, { req }) => {
    if (!req.locations.includes(value)) {
      throw new Error("Invalid start location");
    }
    return true;
  }),
  query("goal").custom((value, { req }) => {
    if (!req.locations.includes(value)) {
      throw new Error("Invalid goal location");
    }
    return true;
  }),
  query("time").isISO8601(),
  validator,
  getTaxiFare
);

module.exports = router;
