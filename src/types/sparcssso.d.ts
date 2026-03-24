export interface SparcsssoUserData {
  uid: string;
  sid: string;
  email: string;
  first_name: string;
  last_name: string;
  gender: string;
  birthday: string;
  flags: string[];
  facebook_id: string | null;
  twitter_id: string | null;
  kaist_id: string | null;
  kaist_info: string | null;
  kaist_info_time: string;
  kaist_v2_info: string | null;
  kaist_v2_info_time: string;
  sparcs_id: string | null;
}
