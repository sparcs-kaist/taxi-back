const expect = require("chai").expect;
const express = require("express");
const roomsHandlers = require("../src/service/rooms");
const { userModel, roomModel, locationModel } = require("../src/db/mongo");
const { userGenerator, testRemover } = require("./utils");
const app = express();

let testData = { rooms: [], users: [], chat: [], location: [], report: [] };

// rooms.js 관련 8개의 handler을 테스트
// 1. test1이 1분 뒤에 출발하는 test-room 방을 생성
describe("[rooms] 1.createHandler", () => {
  it("should create room which departs after 1 minute", async () => {
    const testUser1 = await userGenerator("test1", testData);
    const testFrom = await locationModel.findOne({ koName: "대전역" });
    const testTo = await locationModel.findOne({ koName: "택시승강장" });
    const req = {
      body: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now() + 60 * 1000,
        maxPartLength: 4,
      },
      userId: testUser1.id,
      app,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
      },
    };

    await roomsHandlers.createHandler(req, res);
  });
});

// 2. test1을 통하여 방의 정보 가져옴
describe("[rooms] 2.infoHandler", () => {
  it("should return information of room", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const room = await roomModel.findOne({ name: "test-room" });
    const req = {
      query: { id: room._id },
      userId: testUser1.id,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data).to.has.property("isOver");
      },
    };

    await roomsHandlers.infoHandler(req, res);
  });
});

// 3. test2가 test-room에 join
describe("[rooms] 3.joinHandler", () => {
  it("should return information of room and join", async () => {
    const testUser2 = await userGenerator("test2", testData);
    const testRoom = await roomModel.findOne({ name: "test-room" });
    testData["rooms"].push(testRoom);
    const req = {
      body: {
        roomId: testRoom._id,
      },
      userId: testUser2.id,
      app,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data.part).to.have.lengthOf(2);
      },
    };

    await roomsHandlers.joinHandler(req, res);
  });
});

// 4. 방의 정보를 통해 검색
describe("[rooms] 4.searchHandler", () => {
  it("should return information of searching room", async () => {
    const testFrom = await locationModel.findOne({ koName: "대전역" });
    const testTo = await locationModel.findOne({ koName: "택시승강장" });
    const req = {
      query: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now(),
        withTime: true,
        maxPartLength: 4,
      },
    };
    const res = {
      json: (data) => {
        expect(data[0]).to.has.property("name", "test-room");
        expect(data[0]).to.has.property("settlementTotal");
      },
    };

    await roomsHandlers.searchHandler(req, res);
  });
});

// 5. 방에 속한 유저를 통해 검색
describe("[rooms] 5.searchByUserHandler", () => {
  it("should return information of searching room", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const req = {
      userId: testUser1.id,
    };
    const res = {
      json: (data) => {
        expect(data["ongoing"][0]).to.has.property("name", "test-room");
        expect(data["done"][0]).to.be.an("undefined");
      },
    };

    await roomsHandlers.searchByUserHandler(req, res);
  });
});

// 6.1분이 지난 후, 정산 정보를 불러옴
describe("[rooms] 6.commitPaymentHandler", () => {
  it("should return information of room and commit payment", async () => {
    const testUser1 = await userModel.findOne({ id: "test1" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser1.id,
      timestamp: Date.now() + 60 * 1000,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data).to.has.property("isOver", true);
        expect(data).to.has.property("settlementTotal", 1);
      },
    };
    await roomsHandlers.commitPaymentHandler(req, res);
  });
});

// 7. 도착 정보를 불러옴
describe("[rooms] 7.settlementHandler", () => {
  it("should return information of room and set settlement", async () => {
    const testUser2 = await userModel.findOne({ id: "test2" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser2.id,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data).to.has.property("isOver", true);
        expect(data).to.has.property("settlementTotal", 2);
      },
    };
    await roomsHandlers.settlementHandler(req, res);
  });
});

// 8. test2 방에서 퇴장, 생성해준 data 모두 삭제
describe("[rooms] 8.abortHandler", () => {
  const removeTestData = async () => {
    // drop all testData
    await testRemover(testData);
  };
  it("should return information of room and abort user", async () => {
    const testUser2 = await userModel.findOne({ id: "test2" });
    const testRoom = await roomModel.findOne({ name: "test-room" });
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser2.id,
      session: {},
      app,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data.part).to.have.lengthOf(1);
      },
    };
    await roomsHandlers.abortHandler(req, res);
    after(removeTestData);
  });
});
