const { userModel, roomModel } = require("../db/mongo");
const logger = require("../modules/logger");
const awsS3 = require("../db/awsS3");

const agreeOnTermsOfServiceHandler = async (req, res) => {
  try {
    let user = await userModel.findOne({ id: req.userId });
    if (user.agreeOnTermsOfService !== true) {
      user.agreeOnTermsOfService = true;
      await user.save();
      res.status(200).send(
        "User/agreeOnTermsOfService : agree on Terms of Service successful"
      );
    } else {
      res.status(400).send("User/agreeOnTermsOfService : already agreed");
    }
  } catch {
    res.status(500).send("User/agreeOnTermsOfService : internal server error");
  }
};

const getAgreeOnTermsOfServiceHandler = async (req, res) => {
  try {
    const user = await userModel
      .findOne({ id: req.userId }, "agreeOnTermsOfService")
      .lean();
    const agreeOnTermsOfService = user.agreeOnTermsOfService === true;
    res.json({ agreeOnTermsOfService });
  } catch {
    res.status(500).send("/getAgreeOnTermsOfService : internal server error");
  }
};

const editNicknameHandler = async (req, res) => {
  const newNickname = req.body.nickname;

  // 닉네임을 갱신하고 결과를 반환
  await userModel
    .findOneAndUpdate({ id: req.userId }, { nickname: newNickname })
    .then((result) => {
      if (result) {
        res.status(200).send("User/editNickname : edit user nickname successful");
      } else {
        res.status(400).send("User/editNickname : such user id does not exist");
      }
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).send("User/editNickname : internal server error");
    });
};

const editAccountHandler = async (req, res) => {
  const newAccount = req.body.account;

  // 계좌번호를 갱신하고 결과를 반환
  await userModel
    .findOneAndUpdate({ id: req.userId }, { account: newAccount })
    .then((result) => {
      if (result) {
        res.status(200).send("User/editAccount : edit user account successful");
      } else {
        res.status(400).send("User/editAccount : such user id does not exist");
      }
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).send("User/editAccount : internal server error");
    });
};

const editProfileImgGetPUrlHandler = async (req, res) => {
  try {
    const type = req.body.type;
    const user = await userModel.findOne({ id: req.userId }, "_id");
    if (!user) {
      return res
        .status(500)
        .send("User/editProfileImg/getPUrl : internal server error");
    }
    const key = `profile-img/${user._id}`;
    awsS3.getUploadPUrlPost(key, type, (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("User/editProfileImg/getPUrl : internal server error");
      }
      data.fields["Content-Type"] = type;
      data.fields["key"] = key;
      res.json({
        url: data.url,
        fields: data.fields,
      });
    });
  } catch (e) {
    res.status(500).send("User/editProfileImg/getPUrl : internal server error");
  }
};

const editProfileImgDoneHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ id: req.userId }, "_id");
    if (!user) {
      return res
        .status(500)
        .send("User/editProfileImg/done : internal server error");
    }
    const key = `profile-img/${user._id}`;
    awsS3.foundObject(key, async (err) => {
      if (err) {
        logger.error(err);
        return res
          .status(500)
          .send("User/editProfileImg/done : internal server error");
      }
      const userAfter = await userModel.findOneAndUpdate(
        { id: req.userId },
        { profileImageUrl: user._id },
        { new: true }
      );
      if (!userAfter) {
        return res
          .status(500)
          .send("User/editProfileImg/done : internal server error");
      }
      res.json({
        result: true,
        profileImageUrl: userAfter._id,
      });
    });
  } catch (e) {
    res.status(500).send("User/editProfileImg/done : internal server error");
  }
};

module.exports = {
  agreeOnTermsOfServiceHandler,
  getAgreeOnTermsOfServiceHandler,
  editNicknameHandler,
  editAccountHandler,
  editProfileImgGetPUrlHandler,
  editProfileImgDoneHandler,
};
