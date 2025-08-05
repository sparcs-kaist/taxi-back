/** Taxi 플러터 앱에서 사용되는 JWT의 Payload */
export interface TaxiAppTokenPayload {
  id: string;
  type: "access" | "refresh";
}

/** 원앱에서 사용되는 JWT의 Payload */
export interface OneAppTokenPayload {
  oid: string | undefined;
  uid: string;
}
