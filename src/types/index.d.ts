// to make the file a module and avoid the TypeScript error
export {};

import type { EventStatus } from "@/lottery/types";

declare global {
  namespace Express {
    export interface Request {
      /** 사용자의 ObjectID. MongoDB에서 사용됩니다. */
      userOid?: string;
      /** 사용자의 UserID */
      userUid?: string;
      /** Buddy JWT에서 검증하고 조회한 로그인 정보 */
      buddyLoginInfo?: {
        id: string;
        oid: string;
      };
      /** 요청의 origin. */
      origin?: string;
      /** 사용자의 IP 주소. */
      clientIP?: string;
      /** 요청의 timestamp. */
      timestamp?: number;

      eventStatus?: EventStatus;
    }
  }
}

export type EventConfig = {
  mode: string;
  credit: {
    name: string;
    initialAmount: number;
  };
  period: {
    startAt: string;
    endAt: string;
  };
};
