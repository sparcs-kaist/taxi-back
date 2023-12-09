const tag = "chats";
const apiPrefix = "/chats";

const chatsDocs = {};
chatsDocs[`${apiPrefix}`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/load/before`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/load/after`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/send`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/read`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/uploadChatImg/getPUrl`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

chatsDocs[`${apiPrefix}/uploadChatImg/done`] = {
  post: {
    tags: [tag],
    summary: "",
    description: "",
    requestBody: {},
    responses: {},
  },
};

module.exports = chatsDocs;
