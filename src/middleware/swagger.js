const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");

const router = express.Router();
const options = {
  definition: {
    info: {
      title: "Test API",
      version: "1.0.0",
      description: "Test API with express",
    },
    basePath: "/",
  },
  apis: ["./route/*.js"],
};

router.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggereJsdoc(options)));

module.exports = router;
