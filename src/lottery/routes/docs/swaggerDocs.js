const { eventMode } = require("../../../../loadenv");
const itemsDocs = require("./items");

const apiPrefix = `/events/${eventMode}`;

const eventSwaggerDocs = {
  tags: [
    {
      name: `${apiPrefix}/items`,
      description: "이벤트 - 아이템 관련 API",
    },
  ],
  paths: {
    ...itemsDocs,
  },
  components: {
    schemas: {},
  },
};

module.exports = eventSwaggerDocs;
