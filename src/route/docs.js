const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("../route/docs/docs.json");
const router = express.Router();

router.use(swaggerUi.serve);
router.use(swaggerUi.setup(swaggerSpec, { explorer: true }));

module.exports = router;
