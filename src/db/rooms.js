/**
 * 쿼리를 통해 얻은 Room Document를 populate할 설정값을 정의합니다.
 * @constant {{path: string, select: string, populate?: {path: string, select: string}}[]}
 */
const roomPopulateOption = [
  { path: "from", select: "_id koName enName" },
  { path: "to", select: "_id koName enName" },
  {
    path: "part",
    select: "-_id user settlementStatus",
    populate: { path: "user", select: "_id id name nickname profileImageUrl" },
  },
];

/**
 * Room Object가 주어졌을 때 room의 part array의 각 요소를 API 명세에서와 같이 {userId: String, ... , settlementStatus: String}으로 가공합니다.
 * 또한, 방이 현재 출발했는지 유무인 isDeparted 속성을 추가합니다.
 * @param {Object} roomObject - 정산 정보를 가공할 room Object로, Mongoose Document가 아닌 순수 Javascript Object여야 합니다.
 * @param {Boolean} includeSettlement - 반환 결과에 정산 정보를 포함할 지 여부로, 기본값은 true입니다.
 * @param {Date} timestamp - 방의 출발 여부(isDeparted)를 판단하는 기준이 되는 시각입니다.
 * @param {Boolean} isOver - 방의 완료 여부(isOver)로, 기본값은 false입니다. includeSettlement가 false인 경우 roomDocument의 isOver는 undefined로 설정됩니다.
 * @return {Object} 정산 여부가 위와 같이 가공되고 isDeparted 속성이 추가된 Room Object가 반환됩니다.
 */
const formatSettlement = (roomObject, options = {}) => {
  const formatOptions = {
    includeSettlement: true,
    timestamp: Date.now(),
    isOver: false,
  };
  for (const prop in options) {
    if (prop in formatOptions) {
      formatOptions[prop] = options[prop];
    }
  }
  const { includeSettlement, timestamp, isOver } = formatOptions;

  roomObject.part = roomObject.part.map((participantSubDocument) => {
    const { _id, name, nickname, profileImageUrl } =
      participantSubDocument.user;
    const { settlementStatus } = participantSubDocument;
    return {
      _id,
      name,
      nickname,
      profileImageUrl,
      isSettlement: includeSettlement ? settlementStatus : undefined,
    };
  });
  roomObject.settlementTotal = includeSettlement
    ? roomObject.settlementTotal
    : undefined;
  roomObject.isOver = includeSettlement ? isOver : undefined;
  roomObject.isDeparted = new Date(roomObject.time) < new Date(timestamp);
  return roomObject;
};

module.exports = {
  roomPopulateOption,
  formatSettlement,
};
