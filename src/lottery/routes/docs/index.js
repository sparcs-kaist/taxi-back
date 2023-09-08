const swaggerUi = require("swagger-ui-express");
const swaggerDocs = require("../../../routes/docs/swaggerDocs");
const eventSwaggerDocs = require("./swaggerDocs");

swaggerDocs.tags = [...swaggerDocs.tags, ...eventSwaggerDocs.tags];

swaggerDocs.paths = {
  ...swaggerDocs.paths,
  ...eventSwaggerDocs.paths,
};

swaggerDocs.components.schemas = {
  ...swaggerDocs.components.schemas,
  ...eventSwaggerDocs.components.schemas,
};

/** 기존 docs 라우터에 이벤트 API docs를 추가합니다. */
const appendEventDocs = () => {
  swaggerUi.setup(swaggerDocs, { explorer: true });
};

module.exports = appendEventDocs;
