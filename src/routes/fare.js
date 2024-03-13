const express = require("express");
const fareSchema = require("./docs/schemas/fareSchema");
const { validateQuery } = require("../middlewares/ajv");
const router = express.Router();

const { getTaxiFare, initDatabase } = require("../services/fare");

router.post("/init", initDatabase);

router.get("/getTaxiFare", validateQuery(fareSchema.getTaxiFare), getTaxiFare);

module.exports = router;
