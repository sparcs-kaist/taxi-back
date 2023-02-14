const expect = require("chai").expect;
const usersHandlers = require("../src/service/users");
const { userModel } = require("../src/db/mongo");
const { userGenerator, testRemover } = require("./utils");
const httpMocks = require("node-mocks-http");

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };

// users.js 관련 5개의 handler을 테스트
// 1. test1 유저를 생성 후, agreeOnTermsOfServiceHandler가 제대로 msg를 send 하는지 확인
describe("[users] 1.agreeOnTermsOfServiceHandler", () => {
  it("should return correct response from handler", async () => {
    const testUser1 = await userGenerator("test1", testData);
    const msg =
      "User/agreeOnTermsOfService : agree on Terms of Service successful";
    let req = httpMocks.createRequest({
      userId: testUser1.id,
    });
    let res = httpMocks.createResponse();
    await usersHandlers.agreeOnTermsOfServiceHandler(req, res);

    expect(res).to.has.property("statusCode", 200);
    expect(res._getData()).to.equal(msg);
  });
});

// 2. test1 유저의 agreeOnTermsOfService 정보를 가져와서 true인지 확인
describe("[users] 2.getAgreeOnTermsOfServiceHandler", () => {
  it("should return AgreeOnTermsOfService of user", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    let req = httpMocks.createRequest({
      userId: testUser1.id,
    });
    let res = httpMocks.createResponse();
    await usersHandlers.getAgreeOnTermsOfServiceHandler(req, res);

    expect(res).to.has.property("statusCode", 200);
    expect(res._getJSONData()).to.has.property("agreeOnTermsOfService", true);
  });
});

// 3. test1 유저의 nickname을 test-nickname으로 변경, 성공 메세지가 제대로 오는지 확인
describe("[users] 3.editNicknameHandler", () => {
  const testNickname = "test-nickname";

  it("should return correct response from handler", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const msg = "User/editNickname : edit user nickname successful";
    let req = httpMocks.createRequest({
      userId: testUser1.id,
      body: {
        nickname: testNickname,
      },
    });
    let res = httpMocks.createResponse();
    await usersHandlers.editNicknameHandler(req, res);

    expect(res).to.has.property("statusCode", 200);
    expect(res._getData()).to.equal(msg);
  });

  it("should be changed to new nickname", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    expect(testUser1).to.have.property("nickname", testNickname);
  });
});

// 3. test1 유저의 계좌번호를 testAccount으로 변경, 성공 메세지가 제대로 오는지 확인
describe("[users] 4.editAccountHandler", () => {
  const testAccount = "신한 0123456789012";

  it("should return correct response from handler", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const msg = "User/editAccount : edit user account successful";
    let req = httpMocks.createRequest({
      userId: testUser1.id,
      body: {
        account: testAccount,
      },
    });
    let res = httpMocks.createResponse();
    await usersHandlers.editAccountHandler(req, res);

    expect(res).to.has.property("statusCode", 200);
    expect(res._getData()).to.equal(msg);
  });

  it("should be changed to new account", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    expect(testUser1).to.have.property("account", testAccount);
  });
});

// 5. test1 유저의 프로필 업로드를 위한 PUrl을 제대로 받았는지 확인
// 추가 검증을 위해, key와 Content-Type이 일치하는지 확인
describe("[users] 5.editProfileImgGetPUrlHandler", () => {
  it("should return url and fields of data", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const testImgType = "image/jpg";
    let req = httpMocks.createRequest({
      userId: testUser1.id,
      body: {
        type: testImgType,
      },
    });
    let res = httpMocks.createResponse();
    await usersHandlers.editProfileImgGetPUrlHandler(req, res);

    expect(res).to.has.property("statusCode", 200);
    expect(res._getJSONData()).to.has.property("url");
    expect(res._getJSONData().fields).to.has.property(
      "key",
      `profile-img/${testUser1._id}`
    );
    expect(res._getJSONData().fields).to.has.property(
      "Content-Type",
      testImgType
    );
  });
});

// 6. test1 유저의 프로필 업로드가 정상적으로 완료되었는지 확인
describe("[users] 6.editProfileImgDoneHandler", () => {
  it("should return correct result and new profileImageUrl", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    let req = httpMocks.createRequest({
      userId: testUser1.id,
    });
    let res = httpMocks.createResponse();

    await usersHandlers.editProfileImgDoneHandler(req, res);
    expect(res).to.has.property("statusCode", 200);
  });
});
