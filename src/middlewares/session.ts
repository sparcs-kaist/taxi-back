import expressSession from "express-session";
import { nodeEnv, session as sessionConfig } from "@/loadenv";
import type { LoginInfo } from "@/modules/auths/login";
import sessionStore from "@/modules/stores/sessionStore";
import type { SparcsssoUserData } from "@/types/sparcssso";

type OneAppLoginState =
  // 로그인 요청할 때 설정하는 정보
  | {
      codeChallenge: string;
      oid?: undefined;
      uid?: undefined;
      ssoInfo?: undefined;
      time?: undefined;
    }
  // 로그인 완료 후 설정하는 정보
  | {
      codeChallenge: string;
      oid: string;
      uid: string;
      ssoInfo: SparcsssoUserData;
      time: number;
    };

// 세션에 저장할 데이터 타입을 지정합니다.
declare module "express-session" {
  interface SessionData {
    /** 사용자 로그인 정보 */
    loginInfo?: LoginInfo;
    /** 현재 로그인된 사용자가 Taxi 플러터 앱으로 접속했는지 여부 */
    isApp?: boolean;
    /** 로그인을 위해 필요한 정보를 저장할 object */
    loginAfterState?: {
      /** SPARCS SSO를 통해 로그인할 때 필요한 state. Replace Login의 경우 undefined. */
      state?: string;
      /** 로그인을 요청한 Origin/Referer 값. 원앱 로그인의 경우 undefined. */
      redirectOrigin?: string;
      /** 로그인 후 돌아갈 경로. 원앱 로그인의 경우 undefined. */
      redirectPath?: string;
    };
    /** 원앱 로그인을 위해 필요한 정보를 저장할 object */
    oneAppLoginState?: OneAppLoginState;
    /** Taxi 플러터 앱 로그인용 access token */
    accessToken?: string;
    /** Taxi 플러터 앱 로그인용 refresh token */
    refreshToken?: string;
    /** Taxi 플러터 앱 FCM용 device token */
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
