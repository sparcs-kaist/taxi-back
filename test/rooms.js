const request = require("supertest");
const expect = require("chai").expect;
const express = require("express");

const authHandlers = require("../src/service/auth.replace");
const roomsHandlers = require("../src/service/rooms");
const { userModel, roomModel, locationModel } = require("../src/db/mongo");

const security = require("../security");

describe("room createHandler", function () {
  it("should create room correctly", async function () {
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
  it("should return information of room correctly", async function () {
    let testUser = await userModel.findOne({ id: "sunday" });
    let room = await roomModel.findOne({ name: "test-room" });
    const req = {
      query: { id: room._id },
      userId: testUser.id,
    };
    const res = {
      send: (data) => {
        expect(data).to.has.property("name", "test-room");
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.infoHandler(req, res);
  });
});

describe("room joinHandler", function () {
  it("should return information of room and join successfully", async function () {
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
      },
      status: (data) => {
        expect(data).to.equal(200);
      },
    };

    await roomsHandlers.joinHandler(req, res);
  });
});

// describe("room searchHandler", function () {
//   it("should return information of room successfully", async function () {
//     let testFrom = await locationModel.findOne({ koName: "대전역" });
//     let testTo = await locationModel.findOne({ koName: "택시승강장" });
//     const req = {
//       query: {
//         name: "test-room",
//         from: testFrom._id,
//         to: testTo._id,
//         time: Date.now(),
//         maxPartLength: 4,
//       },
//     };
//     const res = {
//       status: (data) => {
//         expect(data).to.equal(200);
//       },
//     };

//     await roomsHandlers.searchHandler(req, res);
//   });
// });
