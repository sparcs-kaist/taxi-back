const expect = require("chai").expect;
const express = require("express");
const roomsHandlers = require("../src/service/rooms");
const { userModel, roomModel, locationModel } = require("../src/db/mongo");
const { userGenerator } = require("./utils");
const app = express();

describe("[rooms] 1.createHandler", function () {
  it("should create room", async function () {
    let testUser1 = await userGenerator("test1");
    let testFrom = await locationModel.findOne({ koName: "대전역" });
    let testTo = await locationModel.findOne({ koName: "택시승강장" });
    const req = {
      body: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now(),
        maxPartLength: 4,
      },
      userId: testUser1.id,
      app,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.createHandler(req, res);
  });
});

describe("[rooms] 2.infoHandler", function () {
  it("should return information of room", async function () {
    let testUser1 = await userModel.findOne({ id: "test1" });
    let room = await roomModel.findOne({ name: "test-room" });
    const req = {
      query: { id: room._id },
      userId: testUser1.id,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data).to.has.property("isOver");
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.infoHandler(req, res);
  });
});

describe("[rooms] 3.joinHandler", function () {
  it("should return information of room and join", async function () {
    let testUser2 = await userGenerator("test2");
    let testRoom = await roomModel.findOne({ name: "test-room" });
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
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.joinHandler(req, res);
  });
});

describe("[rooms] 4.searchHandler", function () {
  it("should return information of searching room", async function () {
    let testFrom = await locationModel.findOne({ koName: "대전역" });
    let testTo = await locationModel.findOne({ koName: "택시승강장" });
    const req = {
      query: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now() - 1000,
        maxPartLength: 4,
      },
    };
    const res = {
      json: (data) => {
        expect(data[0]).to.has.property("name", "test-room");
        expect(data[0]).to.has.property("settlementTotal");
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.searchHandler(req, res);
  });
});

describe("[rooms] 5.searchByUserHandler", function () {
  it("should return information of searching room", async function () {
    let testUser1 = await userModel.findOne({ id: "test1" });
    const req = {
      userId: testUser1.id,
    };
    const res = {
      json: (data) => {
        expect(data).to.has.property("ongoing");
        expect(data).to.has.property("done");
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.searchByUserHandler(req, res);
  });
});

describe("[rooms] 6.commitPaymentHandler", function () {
  it("should return information of room and commit payment", async function () {
    let testUser1 = await userModel.findOne({ id: "test1" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser1.id,
      timestamp: Date.now(),
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
        expect(data).to.has.property("isOver", true);
        expect(data).to.has.property("settlementTotal", 1);
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };
    await roomsHandlers.commitPaymentHandler(req, res);
  });
});

describe("[rooms] 7.settlementHandler", function () {
  it("should return information of room and set settlement", async function () {
    let testUser2 = await userModel.findOne({ id: "test2" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
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
      status: (data) => {
        expect(data).to.equal(200);
      },
    };
    await roomsHandlers.settlementHandler(req, res);
  });
});

describe("[rooms] 8.abortHandler", function () {
  const removeTestData = async () => {
    // drop all testData
    await roomModel.deleteOne({ name: "test-room" });
    await userModel.deleteOne({ id: "test1" });
    await userModel.deleteOne({ id: "test2" });
  };
  it("should return information of room and abort user", async function () {
    let testUser2 = await userModel.findOne({ id: "test2" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
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
      status: (data) => {
        expect(data).to.equal(200);
      },
    };
    await roomsHandlers.abortHandler(req, res);
    after(removeTestData);
  });
});
