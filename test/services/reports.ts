import { expect } from "chai";
import httpMocks from "node-mocks-http";
import { userModel } from "@/modules/stores/mongo";
import * as reportHandlers from "@/services/reports";
import {
  userGenerator,
  roomGenerator,
  testRemover,
  type TestData,
} from "../utils";

const testData: TestData = {
  rooms: [],
  users: [],
  chat: [],
  location: [],
  report: [],
};

const removeTestData = async () => {
  await testRemover(testData);
};

// reports.js 관련 2개의 handler을 테스트
// 1. test1 유저가 test2 유저를 기타 이유로 신고, 성공 메세지가 제대로 오는지 확인
describe("[reports] 1.createHandler", () => {
  it("should return correct response from handler", async () => {
    const testUser1 = await userGenerator("test1", testData);
    const testUser2 = await userGenerator("test2", testData);
    const testRoom = await roomGenerator("test1", testData);
    const msg = "Reports/create : report successful";
    let req = httpMocks.createRequest({
      userOid: testUser1._id,
      body: {
        reportedId: testUser2._id,
        type: "etc-reason",
        etcDetail: "etc-detail",
        time: Date.now(),
        roomId: testRoom._id,
      },
    });
    let res = httpMocks.createResponse();
    await reportHandlers.createHandler(req, res, () => {});

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
      userOid: testUser1!._id,
    });
    let res = httpMocks.createResponse();
    await reportHandlers.searchByUserHandler(req, res, () => {});
    afterEach(removeTestData);

    const resJson = res._getJSONData();
    expect(res).to.has.property("statusCode", 200);
    expect(resJson).to.has.property("reporting");
    expect(resJson).to.has.property("reported");
    expect(resJson.reporting[0]).to.has.property(
      "creatorId",
      testUser1!._id.toString()
    );
  });
});
