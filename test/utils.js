const { userModel } = require("../src/db/mongo");
const { generateProfileImageUrl } = require("../src/modules/modifyProfile");

// 테스트를 위한 유저 생성 함수
const userGenerator = async (username) => {
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
  });
  await testUser.save();
  return testUser;
};

module.exports = { userGenerator };
