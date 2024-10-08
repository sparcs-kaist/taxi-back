const { userModel, banModel } = require("../modules/stores/mongo");
const logger = require("../modules/logger");
const aws = require("../modules/stores/aws");

// 이벤트 코드입니다.
const { contracts } = require("../lottery");
const {
  generateNickname,
  generateProfileImageUrl,
} = require("../modules/modifyProfile");

const agreeOnTermsOfServiceHandler = async (req, res) => {
  try {
    let user = await userModel.findOne({ id: req.userId });
    if (user.agreeOnTermsOfService !== true) {
      user.agreeOnTermsOfService = true;
      await user.save();
      res
        .status(200)
        .send(
          "Users/agreeOnTermsOfService : agree on Terms of Service successful"
        );
    } else {
      res.status(400).send("Users/agreeOnTermsOfService : already agreed");
    }
  } catch {
    res.status(500).send("Users/agreeOnTermsOfService : internal server error");
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
    res
      .status(500)
      .send("Users/getAgreeOnTermsOfService : internal server error");
  }
};

const editNicknameHandler = async (req, res) => {
  try {
    const newNickname = req.body.nickname;
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { nickname: newNickname }
    );

    if (result) {
      // 이벤트 코드입니다.
      await contracts?.completeNicknameChangingQuest(
        req.userOid,
        req.timestamp
      );

      res
        .status(200)
        .send("Users/editNickname : edit user nickname successful");
    } else {
      res.status(400).send("Users/editNickname : such user id does not exist");
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send("Users/editNickname : internal server error");
  }
};

const editAccountHandler = async (req, res) => {
  try {
    const newAccount = req.body.account;
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { account: newAccount }
    );

    if (result) {
      // 이벤트 코드입니다.
      await contracts?.completeAccountChangingQuest(
        req.userOid,
        req.timestamp,
        newAccount
      );

      res.status(200).send("Users/editAccount : edit user account successful");
    } else {
      res.status(400).send("Users/editAccount : such user id does not exist");
    }
  } catch (err) {
    logger.error(err);
    res.status(500).send("Users/editAccount : internal server error");
  }
};

const editProfileImgGetPUrlHandler = async (req, res) => {
  try {
    const type = req.body.type;
    const user = await userModel.findOne({ id: req.userId }, "_id");
    if (!user) {
      return res
        .status(500)
        .send("Users/editProfileImg/getPUrl : internal server error");
    }
    const key = `profile-img/${user._id}`;
    aws.getUploadPUrlPost(key, type, (err, data) => {
      if (err) {
        return res
          .status(500)
          .send("Users/editProfileImg/getPUrl : internal server error");
      }
      data.fields["Content-Type"] = type;
      data.fields["key"] = key;
      res.json({
        url: data.url,
        fields: data.fields,
      });
    });
  } catch (e) {
    res
      .status(500)
      .send("Users/editProfileImg/getPUrl : internal server error");
  }
};

const editProfileImgDoneHandler = async (req, res) => {
  try {
    const user = await userModel.findOne({ id: req.userId }, "_id");
    if (!user) {
      return res
        .status(500)
        .send("Users/editProfileImg/done : internal server error");
    }
    const key = `profile-img/${user._id}`;
    aws.foundObject(key, async (err) => {
      if (err) {
        logger.error(err);
        return res
          .status(500)
          .send("Users/editProfileImg/done : internal server error");
      }
      const userAfter = await userModel.findOneAndUpdate(
        { id: req.userId },
        { profileImageUrl: aws.getS3Url(`/${key}?token=${req.timestamp}`) },
        { new: true }
      );
      if (!userAfter) {
        return res
          .status(500)
          .send("Users/editProfileImg/done : internal server error");
      }
      res.json({
        result: true,
        profileImageUrl: userAfter.profileImageUrl,
      });
    });
  } catch (e) {
    res.status(500).send("Users/editProfileImg/done : internal server error");
  }
};

const resetNicknameHandler = async (req, res) => {
  try {
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { nickname: generateNickname(req.body.id) },
      { new: true }
    );
    if (!result)
      return res
        .status(400)
        .send("Users/resetNickname : such user does not exist");
    res
      .status(200)
      .send("Users/resetNickname : reset user nickname successful");
  } catch (err) {
    logger.error(err);
    res.status(500).send("Users/resetNickname : internal server error");
  }
};

const resetProfileImgHandler = async (req, res) => {
  try {
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { profileImageUrl: generateProfileImageUrl() },
      { new: true }
    );
    if (!result)
      return res
        .status(400)
        .send("Users/resetProfileImg : such user does not exist");
    res
      .status(200)
      .send("Users/resetProfileImg : reset user profile image successful");
  } catch (err) {
    res.status(500).send("Users/resetProfileImg : internal server error");
  }
};

const getBanRecordHandler = async (req, res) => {
  try {
    // 본인인 경우(ban의 userId가 userSid랑 같은 경우)의 record를 모두 가져옴
    const result = await banModel
      .find({
        userSid: req.session.loginInfo.sid,
      })
      .sort({ expireAt: -1 });
    if (!result)
      return res.status(500).send("Users/getBanRecord : internal server error");
    res.status(200).json(result);
  } catch (err) {
    res.status(500).send("Users/getBanRecord : internal server error");
  }
};

module.exports = {
  agreeOnTermsOfServiceHandler,
  getAgreeOnTermsOfServiceHandler,
  editNicknameHandler,
  editAccountHandler,
  editProfileImgGetPUrlHandler,
  editProfileImgDoneHandler,
  resetNicknameHandler,
  resetProfileImgHandler,
  getBanRecordHandler,
};
