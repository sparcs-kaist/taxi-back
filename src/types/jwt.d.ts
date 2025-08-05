/** Taxi 플러터 앱에서 사용되는 JWT의 Payload */
export interface TaxiAppTokenPayload {
  /** User Document의 ObjectId */
  id: string;
  type: "access" | "refresh";
}

/** 원앱에서 사용되는 JWT의 Payload */
export interface OneAppTokenPayload {
  /**
   * User Document의 ObjectId
   *
   * 미래에 optional로 변경되는 경우 MongoTokenStore 클래스도 함께 수정해야 합니다.
   * undefined인 경우에 Taxi API 접근을 차단하는 부분은 이미 구현되어 있습니다.
   */
  oid: string;
  /** SPARCS SSO에서 넘어온 uid */
  uid: string;
}
