import {
  userModel,
  roomModel,
  chatModel,
  locationModel,
  reportModel,
  connectDatabase,
} from "@/modules/stores/mongo";
import { generateProfileImageUrl } from "@/modules/modifyProfile";
import { mongo as mongoUrl } from "@/loadenv";
import type { Room, User, Chat, Location, Report } from "@/types/mongo";

export interface TestData {
  rooms: Room[];
  users: User[];
  chat: Chat[];
  location: Location[];
  report: Report[];
}

connectDatabase(mongoUrl);

// 테스트를 위한 유저 생성 함수
export const userGenerator = async (username: string, testData: TestData) => {
  const testUser = new userModel({
    id: username,
    name: username + "-name",
    nickname: username + "-nickname",
    profileImageUrl: generateProfileImageUrl(),
    joinat: Date.now(),
    subinfo: {
      kaist: "20180668",
      sparcs: "",
      facebook: "",
      twitter: "",
    },
    email: username + "@kaist.ac.kr",
    withdraw: false,
    ban: false,
    agreeOnTermsOfService: false,
    isAdmin: false,
  });
  await testUser.save();
  testData["users"].push(testUser);
  return testUser;
};

export const roomGenerator = async (roomname: string, testData: TestData) => {
  const testFrom = await locationModel.findOne({ koName: "대전역" });
  const testTo = await locationModel.findOne({ koName: "택시승강장" });
  const testRoom = new roomModel({
    name: roomname + "-room",
    from: testFrom!._id,
    to: testTo!._id,
    time: Date.now() + 60 * 1000,
    part: [],
    madeat: Date.now(),
    maxPartLength: 4,
    settlementTotal: 0,
  });
  await testRoom.save();
  testData["rooms"].push(testRoom);
  return testRoom;
};

// 매 테스트가 끝나고 테스트 데이터를 초기화 해주기 위한 함수
// 더미 데이터를 생성할 경우 이 함수를 통해 제거
export const testRemover = async (testData: TestData) => {
  await Promise.all([
    ...testData["rooms"].map(({ _id }) => roomModel.deleteOne({ _id })),
    ...testData["users"].map(({ _id }) => userModel.deleteOne({ _id })),
    ...testData["chat"].map(({ _id }) => chatModel.deleteOne({ _id })),
    ...testData["location"].map(({ _id }) => locationModel.deleteOne({ _id })),
    ...testData["report"].map(({ _id }) => reportModel.deleteOne({ _id })),
  ]);
};
