const { userModel, roomModel, reportModel } = require("../db/mongo");
const logger = require("../modules/logger");
const awsS3 = require("../db/awsS3");

const agreeOnTermsOfServiceHandler = async (req, res) => {
  try {
    let user = await userModel.findOne({ id: req.userId });
    if (user.agreeOnTermsOfService !== true) {
      user.agreeOnTermsOfService = true;
      await user.save();
      res
        .status(200)
        .send(
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
    res.status(200).json({ agreeOnTermsOfService });
  } catch {
    res.status(500).send("/getAgreeOnTermsOfService : internal server error");
  }
};

const editNicknameHandler = (req, res) => {
  const newNickname = req.body.nickname;

  // 닉네임을 갱신하고 결과를 반환
  userModel
    .findOneAndUpdate({ id: req.userId }, { nickname: newNickname })
    .then((result) => {
      if (result) {
        res
          .status(200)
          .send("User/editNickname : edit user nickname successful");
      } else {
        res.status(400).send("User/editNickname : such user id does not exist");
      }
    })
    .catch((err) => {
      logger.error(err);
      res.status(500).send("User/editNickname : internal server error");
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
      });
    });
  } catch (e) {
    res.status(500).send("User/editProfileImg/done : internal server error");
  }
};

const reportHandler = async (req, res) => {
  try {
    const { name, type, etcDetail, time } = req.body;
    const user = await userModel.findOne({ id: req.userId });
    const creatorId = user._id;

    const reportedUser = await userModel.findOne({ id: name });
    const reportedId = reportedUser._id;

    if (!reportedId) {
      res.status(404).json({ error: "User/report: cannot find user" });
    }

    let report = new reportModel({
      creatorId: creatorId,
      reportedId: reportedId,
      type: type,
      etcDetail: etcDetail,
      time: time,
    });

    await report.save();
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "User/report : internal server error",
    });
  }
};

module.exports = {
  agreeOnTermsOfServiceHandler,
  getAgreeOnTermsOfServiceHandler,
  editNicknameHandler,
  editProfileImgGetPUrlHandler,
  editProfileImgDoneHandler,
  reportHandler,
};
