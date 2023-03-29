const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("./docs/swaggerDocs.js");
const router = express.Router();

router.use(swaggerUi.serve);
router.use(swaggerUi.setup(swaggerDocs, { explorer: true }));

module.exports = router;
