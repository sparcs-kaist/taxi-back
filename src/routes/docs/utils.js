const { zodToJsonSchema } = require("zod-to-json-schema");

const objectIdPattern = `^[a-fA-F\\d]{24}$`;
const roomsPattern = {
  rooms: {
    name: RegExp(
      "^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ,.?! _~/#'\\\\@=\"\\-\\^()+*<>{}[\\]]{1,50}$"
    ),
    from: RegExp("^[A-Za-z0-9가-힣 -]{1,20}$"),
    to: RegExp("^[A-Za-z0-9가-힣 -]{1,20}$"),
  },
};

const zodToSchemaObject = (zodObejct) => {
  try {
    const schemaObject = {};
    Object.keys(zodObejct).forEach((key) => {
      schemaObject[key] = zodToJsonSchema(zodObejct[key]);
    });
    return schemaObject;
  } catch {
    return {};
  }
};

module.exports = { objectIdPattern, roomsPattern, zodToSchemaObject };
