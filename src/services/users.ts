import type { RequestHandler } from "express";
import { userModel, banModel } from "@/modules/stores/mongo";
import logger from "@/modules/logger";
import {
  generateNickname,
  generateProfileImageUrl,
} from "@/modules/modifyProfile";
import * as aws from "@/modules/stores/aws";

// 이벤트 코드입니다.
// const { contracts } = require("@/lottery");

export const agreeOnTermsOfServiceHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    let user = await userModel.findOne({ id: req.userId });
    if (!user) {
      return res.status(400).send("Users/agreeOnTermsOfService : no such user");
    }

    if (user.agreeOnTermsOfService === true) {
      return res.status(400).send("Users/agreeOnTermsOfService: already agreed");
    }

    user.agreeOnTermsOfService = true;
    await user.save();
    return res.status(200).send("Users/agreeOnTermsOfService : agree on Terms of Service successful");
  } catch {
    return res
      .status(500)
      .send("Users/agreeOnTermsOfService : internal server error");
  }
};

export const getAgreeOnTermsOfServiceHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    const user = await userModel
      .findOne({ id: req.userId }, "agreeOnTermsOfService")
      .lean();

    if (!user) {
      return res.status(400).send("Users/agreeOnTermsOfService : no such user");
    }

    if (user) {
      const agreeOnTermsOfService = user.agreeOnTermsOfService === true;
      return res.json({ agreeOnTermsOfService });
    }
  } catch {
    return res
      .status(500)
      .send("Users/getAgreeOnTermsOfService : internal server error");
  }
};

export const editNicknameHandler: RequestHandler = async (req, res) => {
  try {
    const newNickname = req.body.nickname; // TODO: Typing
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { nickname: newNickname }
    );

    if (result) {
      // 이벤트 코드입니다.
      // await contracts?.completeNicknameChangingQuest(
      //   req.userOid,
      //   req.timestamp
      // );

      return res
        .status(200)
        .send("Users/editNickname : edit user nickname successful");
    } else {
      return res
        .status(400)
        .send("Users/editNickname : such user id does not exist");
    }
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/editNickname : internal server error");
  }
};

export const editAccountHandler: RequestHandler = async (req, res) => {
  try {
    const newAccount = req.body.account; // TODO: Typing
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { account: newAccount }
    );

    if (result) {
      // 이벤트 코드입니다.
      // await contracts?.completeAccountChangingQuest(
      //   req.userOid,
      //   req.timestamp,
      //   newAccount
      // );

      return res
        .status(200)
        .send("Users/editAccount : edit user account successful");
    } else {
      return res
        .status(400)
        .send("Users/editAccount : such user id does not exist");
    }
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/editAccount : internal server error");
  }
};

export const editProfileImgGetPUrlHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    const type = req.body.type; // TODO: Typing
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
      return res.json({
        url: data.url,
        fields: data.fields,
      });
    });
  } catch (e) {
    return res
      .status(500)
      .send("Users/editProfileImg/getPUrl : internal server error");
  }
};

export const editProfileImgDoneHandler: RequestHandler = async (req, res) => {
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
      return res.json({
        result: true,
        profileImageUrl: userAfter.profileImageUrl,
      });
    });
  } catch (e) {
    return res
      .status(500)
      .send("Users/editProfileImg/done : internal server error");
  }
};

export const resetNicknameHandler: RequestHandler = async (req, res) => {
  try {
    const result = await userModel.findOneAndUpdate(
      { id: req.userId },
      { nickname: generateNickname(req.body.id) }, // TODO: Typing or Validation
      { new: true }
    );
    if (!result)
      return res
        .status(400)
        .send("Users/resetNickname : such user does not exist");
    return res
      .status(200)
      .send("Users/resetNickname : reset user nickname successful");
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/resetNickname : internal server error");
  }
};

export const resetProfileImgHandler: RequestHandler = async (req, res) => {
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
    return res
      .status(200)
      .send("Users/resetProfileImg : reset user profile image successful");
  } catch (err) {
    return res
      .status(500)
      .send("Users/resetProfileImg : internal server error");
  }
};

export const getBanRecordHandler: RequestHandler = async (req, res) => {
  try {
    // 본인인 경우(ban의 userId가 userSid랑 같은 경우)의 record를 모두 가져옴
    const result = await banModel
      .find({
        userSid: req.session.loginInfo?.sid,
      })
      .sort({ expireAt: -1 });
    if (!result)
      return res.status(500).send("Users/getBanRecord : internal server error");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(500).send("Users/getBanRecord : internal server error");
  }
};
