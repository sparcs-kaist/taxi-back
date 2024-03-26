const express = require("express");
const { validateQuery } = require("../middlewares/zod");
const { fareZod } = require("./docs/schemas/fareSchema");
const { getTaxiFare } = require("../services/fare");
const router = express.Router();

router.get("/getTaxiFare", validateQuery(fareZod.getTaxiFare), getTaxiFare);

module.exports = router;
