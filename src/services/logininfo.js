const { userModel } = require("../modules/stores/mongo");
const { getLoginInfo } = require("../modules/auths/login");
const logger = require("../modules/logger");

const logininfoHandler = async (req, res) => {
  try {
    const user = getLoginInfo(req);
    if (!user.id) return res.json({ id: undefined });

    const userDetail = await userModel.findOne(
      { id: user.id },
      "_id name nickname id withdraw ban joinat agreeOnTermsOfService subinfo email profileImageUrl account"
    );

    res.json({
      oid: userDetail._id,
      id: userDetail.id,
      name: userDetail.name,
      nickname: userDetail.nickname,
      withdraw: userDetail.withdraw,
      ban: userDetail.ban,
      joinat: userDetail.joinat,
      agreeOnTermsOfService: userDetail.agreeOnTermsOfService,
      subinfo: userDetail.subinfo,
      email: userDetail.email,
      profileImgUrl: userDetail.profileImageUrl,
      account: userDetail.account ? userDetail.account : "",
      deviceToken: req.session?.deviceToken,
    });
  } catch (error) {
    logger.error(error);
    res.json({ err: true });
  }
};

module.exports = {
  logininfoHandler,
};
