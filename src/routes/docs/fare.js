const { response } = require("express");
const { objectIdPattern } = require("./utils");

const tag = "fare";
const apiPrefix = "/fare";

const fareDocs = {};
fareDocs[`${apiPrefix}/init`] = {
  post: {
    tags: [tag],
    summary: "택시 요금 db 초기화",
  },
  response: {
    200: {
      description: "TaxiFare Database initialized",
      content: {
        "text/plain": {
          schema: {
            type: "string",
            example: "TaxiFare Database initialized",
          },
        },
      },
    },
    500: {
      description: "TaxiFare Database failed",
      content: {
        "text/html": {
          example: "fare/init : TaxiFare Database failed",
        },
      },
    },
  },
};

fareDocs[`${apiPrefix}/getTaxiFare`] = {
  get: {
    tags: [tag],
    summary: "예상 택시 요금 반환",
    description:
      "start, goal, time에 따라 카이스트 본원 <-> 대전역의 경로를 제외한 다른 경로의 경우, 1주일 전 매일 18:00시의 택시 요금을 반환합니다. <br/> 카이스트 본원 <-> 대전역의 경우, cron으로 1주일 전 미리 캐싱해놓은 데이터를 기반으로 주어진 시간에 대한 택시 요금을 반환합니다. 만일, 해당 데이터가 존재하지 않을 경우에는 직접 호출해 보여줍니다.",
    requestBody: {
      content: {
        "application/json": {
          schema: {
            type: "object",
            properties: {
              from: { type: "string", pattern: objectIdPattern },
              to: { type: "string", pattern: objectIdPattern },
              time: { type: "string", format: "date-time" },
            },
          },
        },
      },
    },
    responses: {
      200: {
        description: "예상 택시 요금 반환 성공",
        content: {
          "text/plain": {
            schema: {
              type: "number",
              example: 10000,
            },
          },
        },
      },
      500: {
        description: "fare/getTaxiFare: Failed to load taxi fare",
        content: {
          "text/html": {
            example: "fare/getTaxiFare: Failed to load taxi fare",
          },
        },
      },
    },
  },
};
