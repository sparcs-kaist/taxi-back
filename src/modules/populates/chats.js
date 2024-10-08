/** @constant {{path: string, select: string}[]}
 * 쿼리를 통해 얻은 Chat Document를 populate할 설정값을 정의합니다.
 */
const chatPopulateOption = [
  {
    path: "authorId",
    select: "_id nickname profileImageUrl withdraw",
  },
];

module.exports = {
  chatPopulateOption,
};
