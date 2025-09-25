const expect = require("chai").expect;
const usersHandlers = require("../../src/services/users");
const { userModel } = require("../../src/modules/stores/mongo");
const { userGenerator, testRemover } = require("../utils");
const httpMocks = require("node-mocks-http");

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };
const removeTestData = async () => {
  await testRemover(testData);
};

// users.js 관련 5개의 handler을 테스트
// 1. test1 유저를 생성 후, agreeOnTermsOfServiceHandler가 제대로 msg를 send 하는지 확인
describe("[users] 1.agreeOnTermsOfServiceHandler", () => {
  it("should return correct response from handler", async () => {
    const testUser1 = await userGenerator("test1", testData);
    const msg =
      "Users/agreeOnTermsOfService : agree on Terms of Service successful";
    let req = httpMocks.createRequest({
      userOid: testUser1._id,
    });
    let res = httpMocks.createResponse();
    await usersHandlers.agreeOnTermsOfServiceHandler(req, res);

    const resData = res._getData();
    expect(res).to.has.property("statusCode", 200);
    expect(resData).to.equal(msg);
  });
});

// 2. test1 유저의 agreeOnTermsOfService 정보를 가져와서 true인지 확인
describe("[users] 2.getAgreeOnTermsOfServiceHandler", () => {
  it("should return AgreeOnTermsOfService of user", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    let req = httpMocks.createRequest({
      userOid: testUser1._id,
    });
    let res = httpMocks.createResponse();
    await usersHandlers.getAgreeOnTermsOfServiceHandler(req, res);

    const resJson = res._getJSONData();
    expect(res).to.has.property("statusCode", 200);
    expect(resJson).to.has.property("agreeOnTermsOfService", true);
  });
});

// 3. test1 유저의 nickname을 test-nickname으로 변경, 성공 메세지가 제대로 오는지 확인
describe("[users] 3.editNicknameHandler", () => {
  const testNickname = "test-nickname";

  it("should return correct response from handler", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const msg = "Users/editNickname : edit user nickname successful";
    let req = httpMocks.createRequest({
      userOid: testUser1._id,
      body: {
        nickname: testNickname,
      },
    });
    let res = httpMocks.createResponse();
    await usersHandlers.editNicknameHandler(req, res);

    const resData = res._getData();
    expect(res).to.has.property("statusCode", 200);
    expect(resData).to.equal(msg);
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
    const msg = "Users/editAccount : edit user account successful";
    let req = httpMocks.createRequest({
      userOid: testUser1._id,
      body: {
        account: testAccount,
      },
    });
    let res = httpMocks.createResponse();
    await usersHandlers.editAccountHandler(req, res);

    const resData = res._getData();
    expect(res).to.has.property("statusCode", 200);
    expect(resData).to.equal(msg);
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
      userOid: testUser1._id,
      body: {
        type: testImgType,
      },
    });
    let res = httpMocks.createResponse();
    await usersHandlers.editProfileImgGetPUrlHandler(req, res);

    const resJson = res._getJSONData();
    expect(res).to.has.property("statusCode", 200);
    expect(resJson).to.has.property("url");
  });
});
