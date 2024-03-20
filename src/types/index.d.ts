// to make the file a module and avoid the TypeScript error
export {};

declare global {
  namespace Express {
    export interface Request {
      /** 사용자 ID. SPARCS SSO로부터 전달받습니다. */
      userId?: string;
      /** 사용자의 ObjectID. MongoDB에서 사용됩니다. */
      userOid?: string;
      /** 요청의 origin. */
      origin?: string;
      /** 사용자의 IP 주소. */
      clientIP?: string;
      /** 요청의 timestamp. */
      timestamp?: number;
    }
  }
}
