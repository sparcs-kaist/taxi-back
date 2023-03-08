const {
  userModel,
  roomModel,
  chatModel,
  locationModel,
  reportModel,
} = require("../src/db/mongo");
const { generateProfileImageUrl } = require("../src/modules/modifyProfile");

// 테스트를 위한 유저 생성 함수
const userGenerator = async (username, testData) => {
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
    email: username + ".kaist.ac.kr",
    withdraw: false,
    ban: false,
    agreeOnTermsOfService: false,
    isAdmin: false,
  });
  await testUser.save();
  testData["users"].push(testUser);
  return testUser;
};

// 매 테스트가 끝나고 테스트 데이터를 초기화 해주기 위한 함수
// 더미 데이터를 생성할 경우 이 함수를 통해 제거
const testRemover = async (testData) => {
  for (const roomData of testData["rooms"]) {
    await roomModel.deleteOne({ _id: roomData });
  }

  for (const userData of testData["users"]) {
    await userModel.deleteOne({ _id: userData });
  }

  for (const chatData of testData["chat"]) {
    await chatModel.deleteOne({ _id: chatData._id });
  }

  for (const locationData of testData["location"]) {
    await locationModel.deleteOne({ _id: locationData._id });
  }

  for (const reportData of testData["report"]) {
    await reportModel.deleteOne({ _id: reportData._id });
  }
};

module.exports = { userGenerator, testRemover };
