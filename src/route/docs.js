const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggereJsdoc = require("swagger-jsdoc");

const router = express.Router();
const swaggerSpec = swaggereJsdoc({
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Taxi API Document",
      version: "1.0.0",
    },
    basePath: "/",
    tags: [
      {
        name: "logininfo",
        description: "로그인 정보 제공",
      },
    ],
    consumes: ["application/json"],
    produces: ["application/json"],
  },
  apis: ["src/route/*.js"],
});

router.use(swaggerUi.serve);
router.get(swaggerUi.setup(swaggerSpec, { explorer: true }));

module.exports = router;
