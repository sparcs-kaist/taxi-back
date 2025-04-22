// to make the file a module and avoid the TypeScript error
export {};

import { EventStatus } from "@/lottery/types";

declare global {
  namespace Express {
    export interface Request {
      /** 사용자의 ObjectID. MongoDB에서 사용됩니다. */
      userOid?: string;
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
