const express = require("express");

const { validateQuery } = require("../middlewares/zod");
const { fareZod } = require("./docs/schemas/fareSchema");
const { getTaxiFareHandler } = require("../services/fare");

const router = express.Router();

router.get(
  "/getTaxiFare",
  validateQuery(fareZod.getTaxiFareHandler),
  getTaxiFareHandler
);

module.exports = router;
