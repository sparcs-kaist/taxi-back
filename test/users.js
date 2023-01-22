const expect = require("chai").expect;
const usersHandlers = require("../src/service/users");
const { userModel } = require("../src/db/mongo");
const { userGenerator, testRemover } = require("./utils");

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };

// users.js 관련 5개의 handler을 테스트
// 1. test1 유저를 생성 후, agreeOnTermsOfServiceHandler가 제대로 send 하는지 확인
describe("[users] 1.agreeOnTermsOfServiceHandler", () => {
  it("should return correct response from handler", async () => {
    let testUser1 = await userGenerator("test1", testData);
    const msg =
      "User/agreeOnTermsOfService : agree on Terms of Service successful";
    const req = {
      userId: testUser1.id,
    };
    const res = {
      send: (data) => {
        expect(data).to.equal(msg);
      },
    };

    await usersHandlers.agreeOnTermsOfServiceHandler(req, res);
  });
});

// 2. test1 유저의 agreeOnTermsOfService 정보를 가져옴
describe("[users] 2.getAgreeOnTermsOfServiceHandler", () => {
  it("should return AgreeOnTermsOfService of user", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const req = {
      userId: testUser1.id,
    };
    const res = {
      json: (data) => {
        expect(data).to.has.property("agreeOnTermsOfService", true);
      },
    };

    await usersHandlers.getAgreeOnTermsOfServiceHandler(req, res);
  });
});

// 3. test1의 nickname을 test-nickname으로 변경
describe("[users] 3.editNicknameHandler", () => {
  it("should return correct response from handler", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const req = {
      userId: testUser1.id,
      body: {
        nickname: "test-nickname",
      },
    };
    const res = {
      send: (data) => {
        expect(data).to.equal(
          "User/editNickname : edit user nickname successful"
        );
      },
    };

    usersHandlers.editNicknameHandler(req, res);
  });

  it("should be changed to new nickname", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    expect(testUser1).to.have.property("nickname", "test-nickname");
  });
});

// 4. Image PUrl이 제대로 변경 되었는지 확인
describe("[users] 4.editProfileImgGetPUrlHandler", () => {
  it("should return url and fields of data", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const req = {
      userId: testUser1.id,
      body: {
        type: "image/jpg",
      },
    };
    const res = {
      json: (data) => {
        expect(data).to.have.property("url");
        expect(data.fields).to.have.property(
          "key",
          `profile-img/${testUser1._id}`
        );
      },
    };

    await usersHandlers.editProfileImgGetPUrlHandler(req, res);
  });
});

// 5. test1 user의 profileImageUrl 주소를 변경
describe("[users] 5.editProfileImgDoneHandler", () => {
  it("should return correct result and new profileImageUrl", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const req = {
      userId: testUser1.id,
    };
    const res = {
      json: (data) => {
        expect(data).to.have.property("result", true);
        expect(data).to.have.property("profileImageUrl", testUser1._id);
      },
    };

    await usersHandlers.editProfileImgDoneHandler(req, res);
  });
});
