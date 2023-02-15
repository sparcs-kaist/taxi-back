const expect = require("chai").expect;
const reportHandlers = require("../src/service/reports");
const { userModel } = require("../src/db/mongo");
const { userGenerator, testRemover } = require("./utils");
const httpMocks = require("node-mocks-http");

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };
const removeTestData = async () => {
  await testRemover(testData);
};

// reports.js 관련 2개의 handler을 테스트
// 1. test1 유저가 test2 유저를 미결제로 신고, 성공 메세지가 제대로 오는지 확인
describe("[reports] 1.createHandler", () => {
  it("should return correct response from handler", async () => {
    const testUser1 = await userGenerator("test1", testData);
    const testUser2 = await userGenerator("test2", testData);
    const msg = "User/report : report successful";
    let req = httpMocks.createRequest({
      userId: testUser1.id,
      body: {
        reportedId: testUser2._id,
        type: "no-settlement",
        etcDetail: "",
        time: Date.now(),
      },
    });
    let res = httpMocks.createResponse();
    await reportHandlers.createHandler(req, res);

    const resData = res._getData();
    expect(res).to.has.property("statusCode", 200);
    expect(resData).to.equal(msg);
  });
});

// 2. test1 유저의 신고한/신고받은 내역이 제대로 오는지 확인, 신고한 내역 작성자에 test1이 있는지 확인
describe("[reports] 2.searchByUserHandler", () => {
  it("should return correct reporting/reported reports of users", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    let req = httpMocks.createRequest({
      userId: testUser1.id,
    });
    let res = httpMocks.createResponse();
    await reportHandlers.searchByUserHandler(req, res);
    afterEach(removeTestData);

    const resJson = res._getJSONData();
    expect(res).to.has.property("statusCode", 200);
    expect(resJson).to.has.property("reporting");
    expect(resJson).to.has.property("reported");
    expect(resJson.reporting[0]).to.has.property(
      "creatorId",
      testUser1._id.toString()
    );
  });
});
