const tag = "statistics";
const apiPrefix = "/statistics";
const { objectId } = require("@/modules/patterns").default;

const statisticsDocs: Record<string, any> = {};

statisticsDocs[`${apiPrefix}/savings`] = {
  get: {
    tags: [tag],
    summary: "아낀 금액 조회",
    description: "아낀 금액(savings)을 계산합니다.",
    parameters: [
      {
        in: "query",
        name: "startDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 시작 시각",
        example: "2025-01-01T00:00:00.000Z",
      },
      {
        in: "query",
        name: "endDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 종료 시각",
        example: "2025-01-31T23:59:59.000Z",
      },
      {
        in: "query",
        name: "userId",
        required: false,
        schema: { type: "string", pattern: objectId.source },
        description:
          "아낀 금액을 조회할 사용자 ObjectId. 미제공 시 전체 사용자 합계를 반환합니다.",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
                userId: { type: ["string", "null"] },
                metric: {
                  type: "string",
                  description: "지표 유형",
                  example: "savings",
                },
                mode: { type: "string", enum: ["total", "user"] },
                totalSavings: { type: "number" },
                rooms: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      roomId: { type: "string" },
                      from: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          enName: { type: "string" },
                          koName: { type: "string" },
                        },
                      },
                      to: {
                        type: "object",
                        properties: {
                          id: { type: "string" },
                          enName: { type: "string" },
                          koName: { type: "string" },
                        },
                      },
                      participantCount: { type: "number" },
                      estimatedFare: { type: "number" },
                      savingsPerUser: { type: "number" },
                      totalSavingsForRoom: { type: "number" },
                      departedAt: { type: "string", format: "date-time" },
                    },
                  },
                },
              },
            },
            example: {
              startDate: "2025-01-01T00:00:00.000Z",
              endDate: "2025-01-31T23:59:59.000Z",
              userId: "665b4d2c7c6f3fd1c1234567",
              metric: "savings",
              mode: "user",
              totalSavings: 12000,
              rooms: [
                {
                  roomId: "665b4d2c7c6f3fd1c0000000",
                  from: {
                    id: "665b4d2c7c6f3fd1c0000001",
                    enName: "Taxi Stand",
                    koName: "택시승강장",
                  },
                  to: {
                    id: "665b4d2c7c6f3fd1c0000002",
                    enName: "Daejeon Station",
                    koName: "대전역",
                  },
                  participantCount: 3,
                  estimatedFare: 18000,
                  savingsPerUser: 12000,
                  totalSavingsForRoom: 12000,
                  departedAt: "2025-01-12T03:00:00.000Z",
                },
              ],
            },
          },
        },
      },
      400: {
        content: {
          "text/html": {
            example: "Statistics/savings : invalid date format",
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Statistics/savings : user not found",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/savings : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/savings/period`] = {
  get: {
    tags: [tag],
    summary: "기간별 아낀 금액 합계",
    description:
      "특정 기간(포함)에 대해 저장된 누적 합계를 이용해 총 아낀 금액을 반환합니다.",
    parameters: [
      {
        in: "query",
        name: "startDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 시작 시각",
        example: "2025-01-01T00:00:00.000Z",
      },
      {
        in: "query",
        name: "endDate",
        required: true,
        schema: { type: "string", format: "date-time" },
        description: "조회 종료 시각",
        example: "2025-01-07T23:59:59.000Z",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "savings-period" },
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
                totalSavings: { type: "number" },
                cumulativeEnd: { type: "number" },
                cumulativeBeforeStart: { type: "number" },
              },
            },
            example: {
              metric: "savings-period",
              startDate: "2025-01-01T00:00:00.000Z",
              endDate: "2025-01-07T23:59:59.000Z",
              cumulativeEnd: 120000,
              cumulativeBeforeStart: 40000,
              totalSavings: 80000,
            },
          },
        },
      },
      400: {
        content: {
          "text/html": {
            examples: {
              invalidDate: {
                summary: "잘못된 날짜 형식",
                value: "Statistics/savings/period : invalid date format",
              },
              reversedRange: {
                summary: "잘못된 기간",
                value: "Statistics/savings/period : startDate is after endDate",
              },
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/savings/period : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/savings/total`] = {
  get: {
    tags: [tag],
    summary: "오늘까지 누적 아낀 금액",
    description: "오늘 현재까지 누적된 아낀 금액을 반환합니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "savings-total" },
                asOf: { type: "string", format: "date-time" },
                totalSavings: { type: "number" },
              },
            },
            example: {
              metric: "savings-total",
              asOf: "2025-01-07T15:00:00.000Z",
              totalSavings: 123000,
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/savings/total : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/users/savings`] = {
  get: {
    tags: [tag],
    summary: "사용자별 누적 아낀 금액",
    description:
      "사용자의 누적 savings 값을 반환합니다. 저장값이 없으면 모든 완료된 방을 기반으로 계산합니다.",
    parameters: [
      {
        in: "query",
        name: "userId",
        required: true,
        schema: { type: "string", pattern: objectId.source },
        description: "조회할 사용자 ObjectId",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "user-savings" },
                userId: { type: "string" },
                totalSavings: { type: "number" },
              },
            },
            example: {
              metric: "user-savings",
              userId: "665b4d2c7c6f3fd1c1234567",
              totalSavings: 23000,
            },
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Statistics/users/savings : user not found",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/users/savings : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/room-creation/monthly`] = {
  get: {
    tags: [tag],
    summary: "월별 방 생성 누적 수",
    description:
      "2022-11부터 지난달까지 월별 방 생성 누적 수를 반환합니다. 현재 달은 포함하지 않습니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "monthly-room-creation" },
                timezone: { type: "string", example: "Asia/Seoul" },
                range: {
                  type: "object",
                  properties: {
                    startMonth: { type: "string", format: "date-time" },
                    endMonth: { type: "string", format: "date-time" },
                  },
                },
                months: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", format: "date-time" },
                      cumulativeRooms: { type: "number" },
                    },
                  },
                },
              },
            },
            example: {
              metric: "monthly-room-creation",
              timezone: "Asia/Seoul",
              range: {
                startMonth: "2022-11-01T00:00:00.000Z",
                endMonth: "2025-02-01T00:00:00.000Z",
              },
              months: [
                { month: "2022-11-01T00:00:00.000Z", cumulativeRooms: 12 },
                { month: "2022-12-01T00:00:00.000Z", cumulativeRooms: 20 },
                { month: "2023-01-01T00:00:00.000Z", cumulativeRooms: 35 },
              ],
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example:
              "Statistics/room-creation/monthly : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/users/monthly`] = {
  get: {
    tags: [tag],
    summary: "월별 사용자 가입 누적 수",
    description:
      "2022-11부터 지난달까지 사용자 가입(등록) 누적 수를 반환합니다. 현재 달은 포함하지 않습니다.",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "monthly-user-creation" },
                timezone: { type: "string", example: "Asia/Seoul" },
                range: {
                  type: "object",
                  properties: {
                    startMonth: { type: "string", format: "date-time" },
                    endMonth: { type: "string", format: "date-time" },
                  },
                },
                months: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      month: { type: "string", format: "date-time" },
                      cumulativeUsers: { type: "number" },
                    },
                  },
                },
              },
            },
            example: {
              metric: "monthly-user-creation",
              timezone: "Asia/Seoul",
              range: {
                startMonth: "2022-11-01T00:00:00.000Z",
                endMonth: "2025-02-01T00:00:00.000Z",
              },
              months: [
                { month: "2022-11-01T00:00:00.000Z", cumulativeUsers: 50 },
                { month: "2022-12-01T00:00:00.000Z", cumulativeUsers: 120 },
                { month: "2023-01-01T00:00:00.000Z", cumulativeUsers: 180 },
              ],
            },
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/users/monthly : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/users/done-room-count`] = {
  get: {
    tags: [tag],
    summary: "사용자 완료 방 개수",
    description:
      "특정 사용자의 완료된(doneRoom) 방 개수를 반환합니다.",
    parameters: [
      {
        in: "query",
        name: "userId",
        required: true,
        schema: { type: "string", pattern: objectId.source },
        description: "조회할 사용자 ObjectId",
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "user-done-room-count" },
                userId: { type: "string" },
                doneRoomCount: { type: "number" },
              },
            },
            example: {
              metric: "user-done-room-count",
              userId: "665b4d2c7c6f3fd1c1234567",
              doneRoomCount: 12,
            },
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Statistics/users/done-room-count : user not found",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/users/done-room-count : internal server error",
          },
        },
      },
    },
  },
};

statisticsDocs[`${apiPrefix}/room-creation/hourly`] = {
  get: {
    tags: [tag],
    summary: "시간대별 방 생성 통계",
    description:
      "특정 위치와 요일에 대해 최근 28일(어제까지) 동안 1시간 간격으로 생성된 방 계수를 계산합니다.",
    parameters: [
      {
        in: "query",
        name: "locationId",
        required: true,
        schema: { type: "string", pattern: objectId.source },
        description: "출발지 또는 도착지 위치 ObjectId",
      },
      {
        in: "query",
        name: "dayOfWeek",
        required: true,
        schema: { type: "integer", minimum: 0, maximum: 6 },
        description: "요일 (일요일=0, 월요일=1, ... 토요일=6)",
        example: 3,
      },
    ],
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "object",
              properties: {
                metric: { type: "string", example: "hourly-room-creation" },
                timezone: { type: "string", example: "Asia/Seoul" },
                startDate: { type: "string", format: "date-time" },
                endDate: { type: "string", format: "date-time" },
                location: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    enName: { type: "string" },
                    koName: { type: "string" },
                  },
                },
                dayOfWeek: {
                  type: "integer",
                  minimum: 0,
                  maximum: 6,
                },
                intervals: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      hour: {
                        type: "integer",
                        minimum: 0,
                        maximum: 23,
                        description: "구간 시작 시각(시)",
                      },
                      timeRange: { type: "string" },
                      totalRooms: { type: "number" },
                    },
                  },
                },
              },
            },
            example: {
              metric: "hourly-room-creation",
              timezone: "Asia/Seoul",
              startDate: "2025-11-01T00:00:00.000Z",
              endDate: "2025-11-28T23:59:59.999Z",
              location: {
                id: "665b4d2c7c6f3fd1c0000001",
                enName: "Taxi Stand",
                koName: "택시승강장",
              },
              dayOfWeek: 3,
              intervals: [
                { hour: 0, timeRange: "00:00-01:00", totalRooms: 0 },
                { hour: 1, timeRange: "01:00-02:00", totalRooms: 0 },
                { hour: 2, timeRange: "02:00-03:00", totalRooms: 0 },
                { hour: 3, timeRange: "03:00-04:00", totalRooms: 0 },
                { hour: 4, timeRange: "04:00-05:00", totalRooms: 0 },
                { hour: 5, timeRange: "05:00-06:00", totalRooms: 0 },
                { hour: 6, timeRange: "06:00-07:00", totalRooms: 0 },
                { hour: 7, timeRange: "07:00-08:00", totalRooms: 0 },
                { hour: 8, timeRange: "08:00-09:00", totalRooms: 0 },
                { hour: 9, timeRange: "09:00-10:00", totalRooms: 0 },
                { hour: 10, timeRange: "10:00-11:00", totalRooms: 0 },
                { hour: 11, timeRange: "11:00-12:00", totalRooms: 0 },
                { hour: 12, timeRange: "12:00-13:00", totalRooms: 0 },
                { hour: 13, timeRange: "13:00-14:00", totalRooms: 3 },
                { hour: 14, timeRange: "14:00-15:00", totalRooms: 1 },
                { hour: 15, timeRange: "15:00-16:00", totalRooms: 0 },
                { hour: 16, timeRange: "16:00-17:00", totalRooms: 0 },
                { hour: 17, timeRange: "17:00-18:00", totalRooms: 0 },
                { hour: 18, timeRange: "18:00-19:00", totalRooms: 0 },
                { hour: 19, timeRange: "19:00-20:00", totalRooms: 0 },
                { hour: 20, timeRange: "20:00-21:00", totalRooms: 0 },
                { hour: 21, timeRange: "21:00-22:00", totalRooms: 0 },
                { hour: 22, timeRange: "22:00-23:00", totalRooms: 0 },
                { hour: 23, timeRange: "23:00-24:00", totalRooms: 0 },
              ],
            },
          },
        },
      },
      404: {
        content: {
          "text/html": {
            example: "Statistics/hourly-room-creation : location not found",
          },
        },
      },
      500: {
        content: {
          "text/html": {
            example: "Statistics/hourly-room-creation : internal server error",
          },
        },
      },
    },
  },
};

export default statisticsDocs;
