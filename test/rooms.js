const expect = require("chai").expect;
const express = require("express");

const authHandlers = require("../src/service/auth.replace");
const roomsHandlers = require("../src/service/rooms");
const { userModel, roomModel, locationModel } = require("../src/db/mongo");

describe("room createHandler", function () {
  it("should create room", async function () {
    let testUser = await userModel.findOne({ id: "sunday" });
    let testFrom = await locationModel.findOne({ koName: "대전역" });
    let testTo = await locationModel.findOne({ koName: "택시승강장" });
    let app = express();
    const req = {
      body: {
        name: "test-room",
        from: testFrom._id,
        to: testTo._id,
        time: Date.now(),
        maxPartLength: 4,
      },
      userId: testUser.id,
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

describe("room infoHandler", function () {
  it("should return information of room", async function () {
    let testUser = await userModel.findOne({ id: "sunday" });
    let room = await roomModel.findOne({ name: "test-room" });
    const req = {
      query: { id: room._id },
      userId: testUser.id,
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

describe("room joinHandler", function () {
  it("should return information of room and join", async function () {
    let testUser = await userModel.findOne({ id: "monday" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
    let app = express();
    const req = {
      body: {
        roomId: testRoom._id,
      },
      userId: testUser.id,
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

describe("room searchHandler", function () {
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

describe("room searchByUserHandler", function () {
  it("should return information of searching room", async function () {
    let testUser = await userModel.findOne({ id: "sunday" });
    const req = {
      userId: testUser.id,
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

describe("room commitPaymentHandler", function () {
  it("should return information of room and commit payment", async function () {
    let testUser = await userModel.findOne({ id: "sunday" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser.id,
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

describe("room settlementHandler", function () {
  it("should return information of room and set settlement", async function () {
    let testUser = await userModel.findOne({ id: "monday" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser.id,
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

describe("room abortHandler", function () {
  it("should return information of room and abort user", async function () {
    let testUser = await userModel.findOne({ id: "monday" });
    let testRoom = await roomModel.findOne({ name: "test-room" });
    let app = express();
    const req = {
      body: { roomId: testRoom._id },
      userId: testUser.id,
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
  });
});
