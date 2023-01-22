module.exports = {
  room: {
    name: RegExp("^[A-Za-z0-9가-힣ㄱ-ㅎㅏ-ㅣ,.?! _-]{1,20}$"),
    from: RegExp("^[A-Za-z0-9가-힣 -]{1,20}$"),
    to: RegExp("^[A-Za-z0-9가-힣 -]{1,20}$"),
  },
  user: {
    nickname: RegExp("^[A-Za-z가-힣ㄱ-ㅎㅏ-ㅣ0-9-_ ]{3,25}$"),
    allowedEmployeeTypes: RegExp("^([PEUR]|[SA]|[PEUR][SA])$"),
    profileImgType: RegExp("^(image/png|image/jpg|image/jpeg)$"),
    account: RegExp("^[A-Za-z가-힣]{2,7} [0-9]{10,14}$"),
  },
  chat: {
    chatImgType: RegExp("^(image/png|image/jpg|image/jpeg)$"),
  },
};
