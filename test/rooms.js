const expect = require("chai").expect;
const express = require("express");
const roomsHandlers = require("../src/service/rooms");
const { userModel, roomModel, locationModel } = require("../src/db/mongo");
const { userGenerator, testRemover } = require("./utils");
const app = express();
const httpMocks = require("node-mocks-http");

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };
const removeTestData = async () => {
  // drop all testData
  await testRemover(testData);
};

// rooms.js 관련 8개의 handler을 테스트
// 1. test1이 1분 뒤에 출발하는 test-room 방을 생성, 제대로 생성 되었는지 확인
describe("[rooms] 1.createHandler", () => {
  it("should create room which departs after 1 minute", async () => {
    const testUser1 = await userGenerator("test1", testData);
    const testFrom = await locationModel.findOne({ koName: "대전역" });
    const testTo = await locationModel.findOne({ koName: "택시승강장" });
    let req = httpMocks.createRequest({
      body: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now() + 60 * 1000,
        maxPartLength: 4,
      },
      userId: testUser1.id,
      app,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.createHandler(req, res);

    const testRoom = await roomModel.findOne({ name: "test-room" });
    testData["rooms"].push(testRoom);
    const resData = res._getData();
    expect(resData).to.has.property("name", "test-room");
  });
});

// 2. test1을 통하여 방의 정보를 제대로 가져오는지 확인
describe("[rooms] 2.infoHandler", () => {
  it("should return information of room", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    let req = httpMocks.createRequest({
      query: { id: testRoom._id },
      userId: testUser1.id,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.infoHandler(req, res);

    const resData = res._getData();
    expect(resData).to.has.property("name", "test-room");
    expect(resData).to.has.property("isOver");
  });
});

// 3. test2가 test-room에 join, 방에 잘 join 했는지 확인
describe("[rooms] 3.joinHandler", () => {
  it("should return information of room and join", async () => {
    const testUser2 = await userGenerator("test2", testData);
    const testRoom = await roomModel.findOne({ name: "test-room" });
    let req = httpMocks.createRequest({
      body: {
        roomId: testRoom._id,
      },
      userId: testUser2.id,
      app,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.joinHandler(req, res);

    const resData = res._getData();
    expect(resData).to.has.property("name", "test-room");
    expect(resData.part).to.have.lengthOf(2);
  });
});

// 4. 방의 정보를 통해 검색, 검색 정보가 예상과 일치하는지 확인
describe("[rooms] 4.searchHandler", () => {
  it("should return information of searching room", async () => {
    const testFrom = await locationModel.findOne({ koName: "대전역" });
    const testTo = await locationModel.findOne({ koName: "택시승강장" });
    let req = httpMocks.createRequest({
      query: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now(),
        withTime: true,
        maxPartLength: 4,
      },
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.searchHandler(req, res);

    const resJson = res._getJSONData();
    expect(resJson[0]).to.has.property("name", "test-room");
    expect(resJson[0].settlementTotal).to.be.undefined;
  });
});

// 5. 방에 속한 유저를 통해 검색
// ongoing은 test-room이 검색되고, done은 아무것도 검색되지 않아야함
describe("[rooms] 5.searchByUserHandler", () => {
  it("should return information of searching room", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    let req = httpMocks.createRequest({
      userId: testUser1.id,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.searchByUserHandler(req, res);

    const resJson = res._getJSONData();
    expect(resJson["ongoing"][0]).to.has.property("name", "test-room");
    expect(resJson["done"][0]).to.be.undefined;
  });
});

// 6.1분이 지난 후, 정산 정보를 불러옴. 예상과 같은 정보를 불러오는지 확인
describe("[rooms] 6.commitPaymentHandler", () => {
  it("should return information of room and commit payment", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    let req = httpMocks.createRequest({
      body: { roomId: testRoom._id },
      userId: testUser1.id,
      timestamp: Date.now() + 60 * 1000,
      app,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.commitPaymentHandler(req, res);

    const resData = res._getData();
    expect(resData).to.has.property("name", "test-room");
    expect(resData).to.has.property("isOver", true);
    expect(resData).to.has.property("settlementTotal", 1);
  });
});

// 7. 도착 정보를 불러옴. 예상과 같은 정보를 불러오는지 확인
describe("[rooms] 7.settlementHandler", () => {
  it("should return information of room and set settlement", async () => {
    const testUser2 = await userModel.findOne({ id: "test2" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    let req = httpMocks.createRequest({
      body: { roomId: testRoom._id },
      userId: testUser2.id,
      app,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.settlementHandler(req, res);

    const resData = res._getData();
    expect(resData).to.has.property("name", "test-room");
    expect(resData).to.has.property("isOver", true);
    expect(resData).to.has.property("settlementTotal", 2);
  });
});

// 8. test2 방에서 퇴장, 제대로 방에서 나갔는지 확인하고 생성해준 data 모두 삭제
describe("[rooms] 8.abortHandler", () => {
  it("should return information of room and abort user", async () => {
    const testUser2 = await userModel.findOne({ id: "test2" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    let req = httpMocks.createRequest({
      body: { roomId: testRoom._id },
      userId: testUser2.id,
      session: {},
      app,
    });
    let res = httpMocks.createResponse();
    await roomsHandlers.abortHandler(req, res);
    afterEach(removeTestData);

    const resData = res._getData();
    expect(resData).to.has.property("name", "test-room");
    expect(resData.part).to.have.lengthOf(1);
  });
});
