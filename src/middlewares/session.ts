import expressSession from "express-session";
import { nodeEnv, session as sessionConfig } from "@/loadenv";
import type { LoginInfo } from "@/modules/auths/login";
import sessionStore from "@/modules/stores/sessionStore";

// 세션에 저장할 데이터 타입을 지정합니다.
declare module "express-session" {
  interface SessionData {
    /** 사용자 로그인 정보 */
    loginInfo?: LoginInfo;
    /** 현재 로그인된 사용자가 앱으로 접속했는지 여부 */
    isApp?: boolean;
    /** SPARCS SSO 로그인 시 state와 로그인 후 redirect 주소를 저장할 object. 타입 수정 필요. */
    loginAfterState?: {
      state?: string;
      redirectOrigin?: string;
      redirectPath?: string;
    };
    /** 원앱 로그인을 위해 필요한 정보를 저장할 object */
    oneAppState?: {
      codeChallenge: string;
      oid?: string;
      uid?: string;
      ssoInfo?: any; // TODO: 타입 수정
    };
    /** 앱 로그인용 access token */
    accessToken?: string;
    /** 앱 로그인용 refresh token */
    refreshToken?: string;
    /** FCM용 device token */
    deviceToken?: string;
  }
}

const sessionMiddleware = expressSession({
  secret: sessionConfig.secret,
  resave: false,
  saveUninitialized: false,
  store: sessionStore,
  cookie: {
    maxAge: sessionConfig.expiry,
    // nodeEnv가 production일 때만 secure cookie를 사용합니다.
    secure: nodeEnv === "production",
  },
});

export default sessionMiddleware;
