const { userModel } = require("../db/mongo");
const { getLoginInfo } = require("../auth/login");

const logininfoHandler = (req, res) => {
  const user = getLoginInfo(req);
  res.json(user);
};

const detailHandler = (req, res) => {
  const user = getLoginInfo(req);

  if (user.id) {
    userModel.findOne(
      { id: user.id },
      "id nickname withdraw ban joinat agreeOnTermsOfService subinfo email profileImageUrl",
      (err, result) => {
        if (err) res.json({ err: true });
        else if (!result) res.json({ err: true });
        else {
          res.json({
            id: result.id,
            nickname: result.nickname,
            withdraw: result.withdraw,
            ban: result.ban,
            joinat: result.joinat,
            agreeOnTermsOfService: result.agreeOnTermsOfService,
            subinfo: result.subinfo,
            email: result.email,
            profileImgUrl: result.profileImageUrl,
          });
        }
      }
    );
  } else res.json({ id: undefined });
};

module.exports = {
  logininfoHandler,
  detailHandler,
};
