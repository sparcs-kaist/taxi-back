const tag = "mileage";
const apiPrefix = "/mileage";

const mileageDocs = {};

mileageDocs[`${apiPrefix}/summary`] = {
  get: {
    tags: [tag],
    summary: "사용자 마일리지 요약 조회",
    description: "사용자의 누적 마일리지, 활성 마일리지, 현재 등급을 조회",
    responses: {
      200: {
        description: "요약 정보 반환",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                totalMileage: { type: "integer", example: 1234 },
                activeMileage: { type: "integer", example: 876 },
                tier: { type: "string", example: "Gold" },
              },
            },
          },
        },
      },
      500: {
        description: "internal server error",
        content: {
          "text/html": { example: "mileage/summary : internal server error" },
        },
      },
    },
  },
};

mileageDocs[`${apiPrefix}/transactions/view`] = {
  get: {
    tags: [tag],
    summary: "사용자 마일리지 내역 조회",
    description:
      "사용자의 마일리지 트랜잭션 내역을 페이징으로 조회합니다. type 필터를 통해 특정 타입 한정 조회 가능. 페이지 당 기본 20개.",
    parameters: [
      {
        in: "query",
        name: "type",
        required: false,
        description: '필터: "earn" | "use" | "event" | "attendance"',
        schema: {
          type: "string",
          enum: ["earn", "use", "event", "attendance"],
        },
      },
      {
        in: "query",
        name: "page",
        required: false,
        description: "페이지 번호(1부터 시작)",
        schema: { type: "integer", minimum: 1, default: 1 },
      },
      {
        in: "query",
        name: "limit",
        required: false,
        description: "페이지 당 아이템 수(기본 20)",
        schema: { type: "integer", minimum: 1, default: 20 },
      },
    ],
    responses: {
      200: {
        description: "트랜잭션 목록 및 페이지네이션",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      type: {
                        type: "string",
                        enum: ["earn", "use", "event", "attendance"],
                        example: "earn",
                      },
                      amount: { type: "integer", example: 50 },
                      createdAt: {
                        type: "string",
                        format: "date-time",
                        example: "2025-06-15T12:00:00Z",
                      },
                      expireAt: {
                        type: "string",
                        format: "date-time",
                        nullable: true,
                        example: "2026-06-15T12:00:00Z",
                      },
                      isExpired: { type: "boolean", example: false },
                    },
                  },
                },
                pagination: {
                  type: "object",
                  properties: {
                    total: { type: "integer", example: 128 },
                    page: { type: "integer", example: 1 },
                    limit: { type: "integer", example: 20 },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "internal server error",
        content: {
          "text/html": {
            example: "mileage/transactions/view : internal server error",
          },
        },
      },
    },
  },
};

mileageDocs[`${apiPrefix}/leaderboard`] = {
  get: {
    tags: [tag],
    summary: "마일리지 리더보드 조회",
    description:
      "누적 마일리지가 높은 상위 사용자들을 조회합니다. 기본 10명, limit 파라미터로 조절 가능.",
    parameters: [
      {
        in: "query",
        name: "limit",
        required: false,
        description: "가져올 사용자 수(기본 10)",
        schema: { type: "integer", minimum: 1, default: 10 },
      },
    ],
    responses: {
      200: {
        description: "리더보드 목록",
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      nickname: { type: "string", example: "국가권력급" },
                      totalMileage: { type: "integer", example: 5432 },
                      tier: { type: "string", example: "Diamond" },
                    },
                  },
                },
              },
            },
          },
        },
      },
      500: {
        description: "internal server error",
        content: {
          "text/html": {
            example: "mileage/leaderboard : internal server error",
          },
        },
      },
    },
  },
};

module.exports = mileageDocs;
