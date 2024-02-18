const { eventConfig } = require("../../../../loadenv");
const apiPrefix = `/events/${eventConfig?.mode}/publicNotice`;

const publicNoticeDocs = {};
// 다음 Endpoint는 2024 봄학기 이벤트에서 사용되지 않습니다.
//
// publicNoticeDocs[`${apiPrefix}/recentTransactions`] = {
//   get: {
//     tags: [`${apiPrefix}`],
//     summary: "최근의 유의미한 상품 획득 기록 반환",
//     description: "모든 유저의 상품 획득 내역 중 유의미한 기록을 가져옵니다.",
//     responses: {
//       200: {
//         description: "",
//         content: {
//           "application/json": {
//             schema: {
//               type: "object",
//               required: ["transactions"],
//               properties: {
//                 transactions: {
//                   type: "array",
//                   description: "상품 획득 기록의 배열",
//                   items: {
//                     type: "string",
//                     example:
//                       "tu**************님께서 일반응모권을(를) 획득하셨습니다.",
//                   },
//                 },
//               },
//             },
//           },
//         },
//       },
//     },
//   },
// };
publicNoticeDocs[`${apiPrefix}/leaderboard`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "리더보드 반환",
    description:
      "새터반 별 재화 개수 기준의 리더보드와 관련된 정보를 가져옵니다.",
    responses: {
      200: {
        description: "",
        content: {
          "application/json": {
            schema: {
              type: "object",
              required: ["leaderboard"],
              properties: {
                leaderboard: {
                  type: "array",
                  description: "이벤트에 참여한 새터반 전체가 포함된 리더보드",
                  items: {
                    type: "object",
                    required: ["group", "creditAmount"],
                    properties: {
                      group: {
                        type: "number",
                        description: "새터반",
                        example: 16,
                      },
                      creditAmount: {
                        type: "number",
                        description: "새터반에 소속된 유저의 전체 재화 개수",
                        example: 3000,
                      },
                    },
                  },
                },
                group: {
                  type: "number",
                  description: "유저의 소속 새터반",
                  example: 16,
                },
                rank: {
                  type: "number",
                  description:
                    "유저의 소속 새터반의 리더보드 순위. 1부터 시작합니다.",
                  example: 1,
                },
              },
            },
          },
        },
      },
    },
  },
};

module.exports = publicNoticeDocs;
