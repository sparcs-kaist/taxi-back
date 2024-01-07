const tag = "rooms";
const apiPrefix = "/rooms";

const roomsDocs = {};

roomsDocs[`${apiPrefix}/create`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/publicInfo`] = {
  get: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/info`] = {
  get: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/join`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/abort`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/search`] = {
  get: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/searchByUser`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/commitPayment`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

roomsDocs[`${apiPrefix}/commitSettlement`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

module.exports = roomsDocs;
