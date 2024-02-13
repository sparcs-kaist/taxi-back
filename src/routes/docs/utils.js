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

module.exports = { objectIdPattern, roomsPattern };
