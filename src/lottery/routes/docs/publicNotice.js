const { eventMode } = require("../../../../loadenv");
const apiPrefix = `/events/${eventMode}/public-notice`;

const publicNoticeDocs = {};
publicNoticeDocs[`${apiPrefix}/get-recent-transaction`] = {
  get: {
    tags: [`${apiPrefix}`],
    summary: "공지를 띄움",
    description: "상품 구매, 뽑기 획득 등등에 대한 공지를 반환",
    responses: {
      200: {
        content: {
          "application/json": {
            schema: {
              type: "array",
              description:
                "use 트랜젝션의 정보를 담은 string 배열. 구매자의 익명 이름과 구매 내역을 문자열로 변환 후 이를 배열로 담아 5개 반환",
              example: ["AB****님께서 송편을(를) 구매하셨습니다.", "..."],
            },
          },
        },
      },
    },
  },
};

module.exports = publicNoticeDocs;
