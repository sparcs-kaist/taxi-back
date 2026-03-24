export default {
  objectId: RegExp("^[a-fA-F\\d]{24}$"),
  jwtToken: RegExp("^[\\w-]+\\.[\\w-]+\\.[\\w-]+$"),
  base64url: RegExp("^[A-Za-z0-9-_]+$"),
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
    chatContent: RegExp("^\\s{0,}\\S{1}[\\s\\S]{0,}$"), // 왼쪽 공백 제외 최소 1개 문자
    chatContentLength: RegExp("^[\\s\\S]{1,140}$"), // 공백 포함 최대 140문자
  },
};
