const { userModel } = require("../db/mongo");
const { getLoginInfo } = require("../auth/login");

const logininfoHandler = (req, res) => {
  const user = getLoginInfo(req);
  res.json(user);
};

const detailHandler = (req, res) => {
  const user = getLoginInfo(req);
  if (!user.id) return res.json({ id: undefined });
  userModel.findOne(
    { id: user.id },
    "_id name nickname id withdraw ban joinat agreeOnTermsOfService subinfo email profileImageUrl",
    (err, result) => {
      if (err) res.json({ err: true });
      else if (!result) res.json({ err: true });
      else {
        res.json({
          oid: result._id,
          id: result.id,
          name: result.name,
          nickname: result.nickname,
          withdraw: result.withdraw,
          ban: result.ban,
          joinat: result.joinat,
          agreeOnTermsOfService: result.agreeOnTermsOfService,
          subinfo: result.subinfo,
          email: result.email,
          profileImgUrl: result.profileImageUrl,
          account: result.account ? result.account : "",
        });
      }
    }
  );
};

module.exports = {
  logininfoHandler,
  detailHandler,
};
