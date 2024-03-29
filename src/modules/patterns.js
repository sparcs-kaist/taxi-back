module.exports = {
  objectId: RegExp("^[a-fA-F\\d]{24}$"),
  room: {
    name: RegExp(
      "^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ,.?! _~/#'\\\\@=\"\\-\\^()+*<>{}[\\]]{1,50}$" // ,.?/#'\@="-^()+*<>{}[] 허용
    ),
  },
  user: {
    nickname: RegExp("^[A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ0-9-_ ]{3,25}$"),
    allowedEmployeeTypes: RegExp("^([PEUR]|[SAGC]|[PEUR][SAGC])$"),
    profileImgType: RegExp("^(image/png|image/jpg|image/jpeg)$"),
    account: RegExp("^[A-Za-z가-힣]{2,7} [0-9]{10,14}$|^$"),
    phoneNumber: RegExp("^010-?([0-9]{3,4})-?([0-9]{4})$"),
  },
  chat: {
    chatImgType: RegExp("^(image/png|image/jpg|image/jpeg)$"),
    chatSendType: RegExp("^(text|account)$"),
  },
};
