const swaggerUi = require("swagger-ui-express");

import swaggerDocs from "../../../routes/docs/swaggerDocs";
import { mileageSwaggerDocs } from "./swaggerDocs";

swaggerDocs.tags = [...swaggerDocs.tags, ...mileageSwaggerDocs.tags];

swaggerDocs.paths = {
  ...swaggerDocs.paths,
  ...mileageSwaggerDocs.paths,
};

swaggerDocs.components.schemas = {
  ...swaggerDocs.components.schemas,
  ...mileageSwaggerDocs.components.schemas,
};

/** 기존 docs 라우터에 이벤트 API docs를 추가합니다. */
export const appendMileageDocs = () => {
  swaggerUi.setup(swaggerDocs, { explorer: true });
};
