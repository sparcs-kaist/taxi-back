import type { RequestHandler } from "express";
import { ssoClient, getLoginInfo, logout } from "@/modules/auths/login";
import { unregisterAllDeviceTokens } from "@/modules/fcm";
import logger from "@/modules/logger";
import {
  generateNickname,
  generateProfileImageUrl,
} from "@/modules/modifyProfile";
import * as aws from "@/modules/stores/aws";
import { userModel, banModel } from "@/modules/stores/mongo";

// 이벤트 코드입니다.
import { contracts } from "@/lottery";
import { eventStatusModel } from "@/lottery/modules/stores/mongo";
import type {
  EditAccountBody,
  EditNicknameBody,
  EditProfileImgGetPUrlBody,
  RegisterPhoneNumberBody,
  RegisterResidenceBody,
} from "@/routes/docs/schemas/usersSchema";

export const agreeOnTermsOfServiceHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    let user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    if (!user) {
      return res.status(400).send("Users/agreeOnTermsOfService : no such user");
    }

    if (user.agreeOnTermsOfService === true) {
      return res
        .status(400)
        .send("Users/agreeOnTermsOfService : already agreed");
    }

    user.agreeOnTermsOfService = true;
    await user.save();
    return res
      .status(200)
      .send(
        "Users/agreeOnTermsOfService : agree on Terms of Service successful"
      );
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
      .findOne({ _id: req.userOid, withdraw: false }, "agreeOnTermsOfService")
      .lean();
    if (!user) {
      return res.status(400).send("Users/agreeOnTermsOfService : no such user");
    }

    const agreeOnTermsOfService = user.agreeOnTermsOfService === true;
    return res.json({ agreeOnTermsOfService });
  } catch {
    return res
      .status(500)
      .send("Users/getAgreeOnTermsOfService : internal server error");
  }
};

export const editNicknameHandler: RequestHandler = async (req, res) => {
  try {
    const newNickname = req.body.nickname as EditNicknameBody["nickname"];
    const result = await userModel.findOneAndUpdate(
      { _id: req.userOid, withdraw: false },
      { nickname: newNickname }
    );

    if (result) {
      // 이벤트 코드입니다.
      /*
      await contracts?.completeNicknameChangingQuest(
        req.userOid,
        req.timestamp
      );
      */

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
    const newAccount = req.body.account as EditAccountBody["account"];
    const result = await userModel.findOneAndUpdate(
      { _id: req.userOid, withdraw: false },
      { account: newAccount }
    );

    if (result) {
      // 이벤트 코드입니다.
      /*
      await contracts?.completeAccountChangingQuest(
        req.userOid,
        req.timestamp,
        newAccount
      );
      */
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

export const registerPhoneNumberHandler: RequestHandler = async (req, res) => {
  try {
    const newPhoneNumber = req.body
      .phoneNumber as RegisterPhoneNumberBody["phoneNumber"];
    const result = await userModel.findOneAndUpdate(
      { _id: req.userOid, withdraw: false },
      { phoneNumber: newPhoneNumber, badge: true }
    );

    if (result) {
      return res
        .status(200)
        .send("Users/registerPhoneNumber : create user phoneNumber successful");
    } else {
      return res
        .status(400)
        .send("Users/registerPhoneNumber : such user id does not exist");
    }
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Users/registerPhoneNumber : internal server error");
  }
};

export const editBadgeHandler: RequestHandler = async (req, res) => {
  try {
    await userModel.findOneAndUpdate(
      {
        _id: req.userOid,
        withdraw: false,
        phoneNumber: { $exists: true, $ne: null },
      },
      { badge: req.body.badge }
    );
    return res.status(200).send("Users/editBadge : badge successfully applied");
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/editBadge : internal server error");
  }
};

export const registerResidenceHandler: RequestHandler = async (req, res) => {
  try {
    const userId = req.userOid;
    const newResidence = req.body
      .residence as RegisterResidenceBody["residence"];

    const result = await userModel.updateOne(
      { _id: userId, withdraw: false },
      { residence: newResidence }
    );

    if (result.matchedCount > 0) {
      return res
        .status(200)
        .send("Users/registerResidence: residenceInfo registered successfully");
    } else {
      return res
        .status(400)
        .send("Users/registerResidence: user not found or update failed");
    }
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Users/registerResidence: internal server error");
  }
};

export const deleteResidenceHandler: RequestHandler = async (req, res) => {
  try {
    const userId = req.userOid;

    const result = await userModel.updateOne(
      { _id: userId, withdraw: false },
      { $unset: { residence: "" } }
    );
    if (result.matchedCount > 0) {
      return res
        .status(200)
        .send("Users/deleteResidence: residenceInfo deleted successfully");
    } else {
      return res
        .status(400)
        .send("Users/deleteResidence: user not found or update failed");
    }
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/deleteResidence: internal server error");
  }
};

export const editProfileImgGetPUrlHandler: RequestHandler = async (
  req,
  res
) => {
  try {
    const type = req.body.type as EditProfileImgGetPUrlBody["type"];
    const user = await userModel.findOne(
      { _id: req.userOid, withdraw: false },
      "_id"
    );
    if (!user) {
      return res
        .status(500)
        .send("Users/editProfileImg/getPUrl : internal server error");
    }
    const key = `profile-img/${user._id}`;
    const data = await aws.getUploadPUrlPost(key, type);
    return res.json({ url: data });
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Users/editProfileImg/getPUrl : internal server error");
  }
};

export const editProfileImgDoneHandler: RequestHandler = async (req, res) => {
  try {
    const user = await userModel.findOne(
      { _id: req.userOid, withdraw: false },
      "_id"
    );
    if (!user) {
      return res
        .status(500)
        .send("Users/editProfileImg/done : internal server error");
    }

    const key = `profile-img/${user._id}`;
    if (!(await aws.foundObject(key))) {
      return res
        .status(400)
        .send("Users/editProfileImg/done : no such image uploaded");
    }

    const userAfter = await userModel.findOneAndUpdate(
      { _id: req.userOid, withdraw: false },
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
  } catch (err) {
    logger.error(err);
    return res
      .status(500)
      .send("Users/editProfileImg/done : internal server error");
  }
};

export const resetNicknameHandler: RequestHandler = async (req, res) => {
  try {
    const result = await userModel.findOneAndUpdate(
      { _id: req.userOid, withdraw: false },
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
      { _id: req.userOid, withdraw: false },
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
    logger.error(err);
    return res
      .status(500)
      .send("Users/resetProfileImg : internal server error");
  }
};

export const getBanRecordHandler: RequestHandler = async (req, res) => {
  try {
    // 본인인 경우(ban의 userId가 userId랑 같은 경우)의 record를 모두 가져옴
    const result = await banModel
      .find({
        userUid: req.userUid,
      })
      .sort({ expireAt: -1 });
    if (!result)
      return res.status(500).send("Users/getBanRecord : internal server error");
    return res.status(200).json(result);
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/getBanRecord : internal server error");
  }
};

export const withdrawHandler: RequestHandler = async (req, res) => {
  try {
    const { sid } = getLoginInfo(req);

    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    if (!user) {
      return res.status(500).send("Users/withdraw : internal server error");
    }

    // 회원 탈퇴가 가능한 조건인지 확인
    if (user.withdraw) {
      return res.status(400).send("Users/withdraw : already withdrawn");
    } else if (user.ongoingRoom?.length !== 0) {
      return res.status(400).send("Users/withdraw : ongoing room exists");
    }

    // 이벤트 코드입니다.
    const isEventRegistered = await eventStatusModel.exists({
      userId: req.userOid,
    });
    if (isEventRegistered) {
      return res.status(400).send("Users/withdraw : event registered");
    }

    // 등록된 모든 디바이스 토큰 삭제
    await unregisterAllDeviceTokens(req.userOid!);

    // 회원 탈퇴 처리 (Soft Delete)
    user.withdraw = true;
    user.withdrewAt = new Date(req.timestamp!);
    await user.save();

    // 로그아웃 처리
    const redirectUrl = new URL("/mypage?withdraw=true", req.origin).href;
    const ssoLogoutUrl =
      ssoClient?.getLogoutUrl(sid, redirectUrl) ?? redirectUrl;
    logout(req);
    return res.json({ ssoLogoutUrl });
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Users/withdraw : internal server error");
  }
};
