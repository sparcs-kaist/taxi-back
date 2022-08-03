const { userModel, roomModel } = require("../db/mongo");
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
    .catch((error) => {
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
    awsS3.foundObject(key, async (err, data) => {
      if (err) {
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

const listAllUsersHandler = function (_, res) {
  userModel.find({}, function (err, result) {
    if (err) throw err;
    if (result) {
      res.json(result);
    }
  });
};

const listRoomsOfUserHandler = async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).exec();
    if (user) {
      res.send({
        id: req.params.id,
        rooms: user.room,
      });
    } else {
      res.status(404).json({
        error: "user/rooms : such id does not exist",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "user/rooms : internal server error",
    });
  }
};

const idHandler = async (req, res) => {
  try {
    let usr = await userModel.findById(req.params.id);
    if (usr) {
      res.send(usr);
    } else {
      res.status(404).json({
        error: "user/:id : such id does not exist",
      });
    }
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "user/:id : internal server error",
    });
  }
};

const idEditHandler = (req, res) => {
  userModel
    .findByIdAndUpdate(req.params.id, { $set: req.body })
    .then((result) => {
      if (result) {
        res.status(200).send("edit user successful");
      } else {
        res.status(400).send("such id does not exist");
      }
    })
    .catch((err) => {
      logger.error(err);
    });
};

const idBanHandler = async (req, res) => {
  let user = await userModel.findById(req.params.id);
  if (user) {
    if (user.ban === false) {
      user.ban = true;
      try {
        await user.save();
        res.status(200).send("The user banned successfully");
      } catch (err) {
        logger.error(err);
        res.status(500).send("User/ban : Error 500");
      }
    } else {
      res.status(409).send("The user is already banned");
    }
  } else {
    res.status(400).send("The user does not exist");
  }
};

const idUnbanHandler = async (req, res) => {
  let user = await userModel.findById(req.params.id);
  if (user) {
    if (user.ban === true) {
      user.ban = false;
      try {
        await user.save();
        res.status(200).send("The user unbanned successfully");
      } catch (err) {
        logger.error(err);
        res.status(500).send("User/unban : Error 500");
      }
    } else {
      res.status(409).send("The user is already unbanned");
    }
  } else {
    res.status(400).send("The user does not exist");
  }
};

const idParticipateHandler = async (req, res) => {
  // request JSON validation
  if (!req.body.room) res.status(400).send("User/participate : Bad request");

  // Validate whether a room ObjectID is valid or not
  // And add the user ObjectID to room participants list
  try {
    let room = await roomModel.findById(req.body.room);
    if (!room) res.status(400).send("User/participate : No corresponding room");
    room.part.append(req.params.id);
    await room.save();
  } catch (err) {
    logger.error(err);
    res.status(500).send("User/participate : Error 500");
  }

  try {
    let user = await userModel.findById(req.params.id);
    if (!user) res.status(400).send("The user does not exist");
    if (user.room.includes(req.body.room))
      res.status(409).send("The user already entered the room");
    user.room.append(req.body.room);
    await user.save();
    res.status(200).send("User/participate : Successful");
  } catch (err) {
    logger.error(err);
    res.status(500).send("User/participate : Error 500");
  }
};

module.exports = {
  agreeOnTermsOfServiceHandler,
  getAgreeOnTermsOfServiceHandler,
  editNicknameHandler,
  editProfileImgGetPUrlHandler,
  editProfileImgDoneHandler,
  listAllUsersHandler,
  listRoomsOfUserHandler,
  idHandler,
  idEditHandler,
  idBanHandler,
  idUnbanHandler,
  idParticipateHandler,
};
