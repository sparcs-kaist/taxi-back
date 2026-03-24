const { objectIdPattern } = require("./utils");

const tag = "notice";
const apiPrefix = "/notice";

interface ApiResponseSchema {
  type: string;
  pattern?: string;
}

interface ApiResponse {
  description: string;
  content: {
    [contentType: string]: {
      schema?: {
        type: string;
        properties: {
          [key: string]: ApiResponseSchema | { type: string };
        };
      };
      example?: string;
    };
  };
}

interface NoticeDocsType {
  [endpoint: string]: {
    get: {
      tags: string[];
      summary: string;
      description: string;
      responses: {
        [statusCode: number]: ApiResponse;
      };
    };
  };
}

const noticeDocs: NoticeDocsType = {};

noticeDocs[`${apiPrefix}/list`] = {
  get: {
    tags: [tag],
    summary: "공지사항 목록 반환",
    description: "공지사항의 목록을 반환합니다.",
    responses: {
      200: {
        description: "예상 택시 요금 반환 성공",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                _id: { type: "string", pattern: objectIdPattern },
                title: { type: "string", pattern: objectIdPattern },
                is_pinned: { type: "boolean" },
                is_active: { type: "boolean" },
                createdAt: { type: "boolean" },
              },
            },
          },
        },
      },
      500: {
        description: "notice/list: Failed to load notices",
        content: {
          "text/html": {
            example: "notice/list: Failed to load notices",
          },
        },
      },
    },
  },
};

export default noticeDocs;
