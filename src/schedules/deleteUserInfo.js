const { userModel } = require("../modules/stores/mongo");
const logger = require("../modules/logger").default;

module.exports = async () => {
  try {
    // 탈퇴일로부터 5년 이상 경과한 사용자의 개인정보 삭제
    await userModel.updateMany(
      {
        withdraw: true,
        withdrewAt: {
          $lte: new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000),
        },
        name: { $ne: "" },
      },
      {
        $set: {
          name: "",
          nickname: "",
          id: "",
          profileImageUrl: "",
          // ongoingRoom
          // doneRoom
          ban: false,
          // joinat
          agreeOnTermsOfService: false,
          "subinfo.kaist": "",
          "subinfo.sparcs": "",
          "subinfo.facebook": "",
          "subinfo.twitter": "",
          email: "",
          isAdmin: false,
          account: "",
        },
        $unset: {
          phoneNumber: "",
        },
      }
    );
  } catch (err) {
    logger.error(err);
  }
};
