import { z } from "zod";
import { jwt as jwtConfig, nodeEnv, testAccounts } from "@/loadenv";
import logger from "@/modules/logger";
import * as jwt from "@/modules/auths/jwt";
import { getBearerToken } from "@/modules/auths/login";
import { userModel } from "@/modules/stores/mongo";
import type { RequestHandler } from "express";
import type { BuddyBootstrapBody } from "@/routes/docs/schemas/authSchema";
import { joinus, transUserData, update } from "./auth";

/** Buddy 백엔드가 서명한 ssoInfo JWT에 담긴 SPARCS SSO 사용자 정보 (sid 제외) */
const buddySsoInfoPayload = z.object({
  uid: z.string().min(1),
  email: z.string().min(1),
  first_name: z.string(),
  last_name: z.string(),
  gender: z.string(),
  birthday: z.string(),
  flags: z.array(z.string()),
  facebook_id: z.string().nullable(),
  twitter_id: z.string().nullable(),
  kaist_id: z.string().nullable(),
  kaist_info: z.string().nullable(),
  kaist_info_time: z.string(),
  kaist_v2_info: z.string().nullable(),
  kaist_v2_info_time: z.string(),
  sparcs_id: z.string().nullable(),
});

/**
 * Buddy 앱이 로그인 직후 호출해 택시 회원을 생성하거나 갱신합니다.
 * Bearer로 Buddy access token을, body로 Buddy 로그인 응답의 ssoInfo를 받습니다.
 * 아직 택시 회원이 없는 사용자도 호출하므로 buddyTokenMiddleware는 이 경로를 건너뛰고,
 * 두 토큰은 여기서 직접 검증합니다.
 */
const buddyBootstrapHandler: RequestHandler = async (req, res) => {
  const token = getBearerToken(req);
  const access = token ? jwt.verifyBuddyToken(token) : undefined;
  if (access === jwtConfig.TOKEN_EXPIRED) {
    // 앱이 토큰을 갱신한 뒤 다시 시도하도록 401을 반환합니다.
    return res.status(401).json({ error: "token expired" });
  }
  if (!access) {
    return res.status(401).json({ error: "unauthorized" });
  }

  const { ssoInfo } = req.body as BuddyBootstrapBody;
  const parsed = buddySsoInfoPayload.safeParse(jwt.verifyBuddySsoInfo(ssoInfo));
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid ssoInfo" });
  }
  if (parsed.data.uid !== access.uid) {
    return res.status(400).json({ error: "uid mismatch" });
  }

  let userData: ReturnType<typeof transUserData>;
  try {
    // sid는 택시 웹의 SSO 세션 식별자로, 가입과 갱신에는 사용하지 않습니다.
    userData = transUserData({ ...parsed.data, sid: "" });
  } catch {
    // kaist_info / kaist_v2_info가 올바른 JSON이 아닌 경우
    return res.status(400).json({ error: "invalid ssoInfo" });
  }

  try {
    if (
      !userData.isEligible &&
      nodeEnv === "production" &&
      !testAccounts?.includes(userData.email)
    ) {
      return res.status(403).json({ error: "registration denied" });
    }

    const user = await userModel.findOne(
      { id: userData.id, withdraw: false },
      "name email subinfo.kaist"
    );
    if (!user) {
      if (!(await joinus(req, userData))) {
        return res.status(403).json({ error: "registration denied" });
      }
      return res.sendStatus(201);
    }

    if (
      user.name !== userData.name ||
      user.email !== userData.email ||
      user.subinfo?.kaist !== userData.kaist
    ) {
      await update(userData);
    }
    return res.sendStatus(200);
  } catch (error) {
    logger.error(error);
    return res.status(500).json({ error: "internal server error" });
  }
};

export default buddyBootstrapHandler;
