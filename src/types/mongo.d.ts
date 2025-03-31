import type { Document, Types } from "mongoose";

export interface User extends Document<Types.ObjectId> {
  /** 사용자의 실명. */
  name: string;
  /** 사용자의 닉네임. */
  nickname: string;
  /** Taxi에서만 사용되는 사용자의 ID. */
  id: string;
  /** 계정 프로필 이미지 주소. */
  profileImageUrl: string;
  /** 사용자가 참여한 방 중 현재 진행 중인 방의 배열. */
  ongoingRoom?: Types.Array<Types.ObjectId>;
  /** 사용자가 참여한 방 중 완료된 방의 배열. */
  doneRoom?: Types.Array<Types.ObjectId>;
  /** 계정 탈퇴 여부. */
  withdraw: boolean;
  /** 계정 탈퇴 시각. */
  withdrewAt?: Date;
  /** 사용자의 전화번호. 2023 가을 이벤트부터 추가됨. */
  phoneNumber?: string;
  /** 계정 정지 여부. */
  ban: boolean;
  /** 계정 가입 시각. */
  joinat: Date;
  /** 사용자의 Taxi 이용약관 동의 여부. */
  agreeOnTermsOfService: boolean;
  subinfo?: {
    /** 사용자의 KAIST 학번. */
    kaist: string;
    sparcs: string;
    facebook: string;
    twitter: string;
  };
  /** 사용자의 이메일 주소. */
  email: string;
  /** 계정의 관리자 여부. */
  isAdmin: boolean;
  /** 사용자의 계좌번호 정보. */
  account: string;
}

export interface Ban extends Document<Types.ObjectId> {
  /** 정지된 사용자의 ID. */
  userId: string;
  /** 정지 사유. */
  reason: string;
  /** 정지 시각. */
  bannedAt: Date;
  /** 정지 만료 시각. */
  expireAt: Date;
  /** 정지된 서비스의 이름. */
  serviceName: "service" | "2023-fall-event";
}

export type SettlementStatus =
  | "not-departed"
  | "paid"
  | "send-required"
  | "sent";

export interface Participant extends Document<Types.ObjectId> {
  /** 방 참여자의 User ObjectID. */
  user: Types.ObjectId;
  /** 방 참여자의 정산 상태. */
  settlementStatus: SettlementStatus;
  /** 방 참여자가 마지막으로 채팅을 읽은 시각. */
  readAt?: Date;
}

export interface DeviceToken extends Document<Types.ObjectId> {
  /** 디바이스 토큰 소유자의 User ObjectID. */
  userId: Types.ObjectId;
  /** 소유한 디바이스 토큰의 배열. */
  deviceTokens: Types.Array<string>;
}

export interface NotificationOption extends Document<Types.ObjectId> {
  deviceToken: string;
  /** 채팅 알림 수신 여부. */
  chatting: boolean;
  /** 방 알림 키워드. */
  keywords: Types.Array<string>;
  /** 출발 전 알림 발송 여부. */
  beforeDepart: boolean;
  /** 공지성 알림 수신 여부. */
  notice: boolean;
  /** 광고성 알림 수신 여부. */
  advertisement: boolean;
}

export interface TopicSubscription extends Document<Types.ObjectId> {
  deviceToken?: string;
  topic?: string;
  subscribedAt: Date;
}

export interface Room extends Document<Types.ObjectId> {
  /** 방의 이름. */
  name: string;
  /** 방의 출발지의 Location ObjectID. */
  from: Types.ObjectId;
  /** 방의 목적지의 Location ObjectID. */
  to: Types.ObjectId;
  /** 방의 출발 시각. */
  time: Date;
  /** 방 참여자의 배열. */
  part?: Types.DocumentArray<Participant>;
  /** 방의 생성 시각. */
  madeat: Date;
  /** 방 참여자 중 정산을 완료한 참여자의 수. */
  settlementTotal: number;
  /** 방의 최대 참여자 수. */
  maxPartLength: number;
}

export interface Location extends Document<Types.ObjectId> {
  enName: string;
  koName: string;
  priority: number;
  isValid: boolean;
  /** 위도. */
  latitude: number;
  /** 경도. */
  longitude: number;
}

export type ChatType =
  | "text"
  | "in"
  | "out"
  | "s3img"
  | "payment"
  | "settlement"
  | "account"
  | "departure"
  | "arrival";

export interface Chat extends Document<Types.ObjectId> {
  /** 메세지가 전송된 방의 Room ObjectID. */
  roomId: Types.ObjectId;
  /** 메세지의 종류. */
  type?: ChatType;
  /** 메세지의 작성자의 User ObjectID. */
  authorId?: Types.ObjectId;
  content: string;
  time: Date;
  isValid: boolean;
}

export interface Report extends Document<Types.ObjectId> {
  /** 신고한 사용자의 ObjectID. */
  creatorId: Types.ObjectId;
  /** 신고받은 사용자의 ObjectID. */
  reportedId: Types.ObjectId;
  /** 신고의 종류. */
  type: "no-settlement" | "no-show" | "etc-reason";
  /** 신고의 기타 세부 사유. */
  etcDetail: string;
  /** 신고한 시각. */
  time: Date;
  /** 신고한 방의 ObjectID. */
  roomId?: Types.ObjectId;
}

export interface AdminIPWhitelist extends Document<Types.ObjectId> {
  ip: string;
  description: string;
}

export type AdminLogAction = "create" | "read" | "update" | "delete";

export interface AdminLog extends Document<Types.ObjectId> {
  /** 로그 발생자의 User ObjectID. */
  user: Types.ObjectId;
  /** 로그의 발생 시각. */
  time: Date;
  /** 로그의 발생 IP 주소. */
  ip: string;
  /** 취급한 대상. */
  target: string;
  /** 수행한 업무. */
  action: AdminLogAction;
}

export interface TaxiFare extends Document<Types.ObjectId> {
  /** 출발지의 Location ObjectID. */
  from: Types.ObjectId;
  /** 목적지의 Location ObjectID. */
  to: Types.ObjectId;
  isMajor: boolean;
  time: number;
  /** 예상 택시 요금. */
  fare: number;
}
