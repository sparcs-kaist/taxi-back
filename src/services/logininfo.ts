import { resolveS3Url } from "@/modules/stores/aws";
import { userModel } from "@/modules/stores/mongo";
import { getLoginInfo } from "@/modules/auths/login";
import logger from "@/modules/logger";
import type { RequestHandler } from "express";

export const logininfoHandler: RequestHandler = async (req, res) => {
  try {
    const user = getLoginInfo(req);
    if (!user.oid) return res.json({ id: undefined });

    const userDetail = await userModel.findOne(
      { _id: user.oid, withdraw: false },
      "_id name nickname id withdraw phoneNumber badge residence ban joinat agreeOnTermsOfService subinfo email profileImageUrl account"
    );

    if (!userDetail)
      return res
        .status(400)
        .send("logininfo/userModel : userDetail is invalid");

    res.json({
      oid: userDetail._id,
      id: userDetail.id,
      name: userDetail.name,
      nickname: userDetail.nickname,
      withdraw: userDetail.withdraw,
      phoneNumber: userDetail.phoneNumber,
      badge: userDetail.badge,
      residence: userDetail.residence,
      ban: userDetail.ban,
      joinat: userDetail.joinat,
      agreeOnTermsOfService: userDetail.agreeOnTermsOfService,
      subinfo: userDetail.subinfo,
      email: userDetail.email,
      profileImgUrl: resolveS3Url(userDetail.profileImageUrl),
      account: userDetail.account ? userDetail.account : "",
      deviceType: req.session?.isApp ? "app" : "web",
      deviceToken: req.session?.deviceToken,
      accessToken: req.session?.accessToken,
      refreshToken: req.session?.refreshToken,
    });
  } catch (error) {
    logger.error(error);
    res.json({ err: true });
  }
};
