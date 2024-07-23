const { userModel } = require("../modules/stores/mongo");
const logger = require("../modules/logger");

module.exports = async () => {
  try {
    // 탈퇴일로부터 1년 이상 경과한 사용자
    const expiredUsers = await userModel.find({
      withdraw: { $lte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
    });

    await Promise.all(
      expiredUsers.map(async (user) => {
        if (user.name === "") return; // 이미 개인정보가 삭제된 사용자

        user.name = "";
        user.nickname = "";
        //user.id
        user.profileImageUrl = "";
        //user.ongoingRoom
        //user.doneRoom
        //user.withdraw
        user.phoneNumber = undefined;
        user.ban = false;
        //user.joinat
        user.agreeOnTermsOfService = false;
        user.subinfo.kaist = "";
        user.subinfo.sparcs = "";
        user.subinfo.facebook = "";
        user.subinfo.twitter = "";
        user.email = "";
        user.isAdmin = false;
        user.account = "";

        await user.save();
      })
    );
  } catch (err) {
    logger.error(err);
  }
};
