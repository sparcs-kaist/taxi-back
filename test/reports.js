const expect = require("chai").expect;
const reportHandlers = require("../src/service/reports");
const { userModel } = require("../src/db/mongo");
const { userGenerator, testRemover } = require("./utils");
const httpMocks = require("node-mocks-http");

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };
const removeTestData = async () => {
  await testRemover(testData);
};

// 1. test1 유저가 test2 유저를 미결제로 신고, 성공 메세지가 제대로 오는지 확인
describe("[reports] 1.createHandler", () => {
  it("should return correct response from handler", async () => {
    let testUser1 = await userGenerator("test1", testData);
    let testUser2 = await userGenerator("test2", testData);
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

    expect(res).to.has.property("statusCode", 200);
    expect(res._getData()).to.equal(msg);
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

    expect(res).to.has.property("statusCode", 200);
    expect(res._getJSONData()).to.has.property("reporting");
    expect(res._getJSONData()).to.has.property("reported");
    expect(res._getJSONData().reporting[0]).to.has.property(
      "creatorId",
      testUser1._id.toString()
    );
  });
});
