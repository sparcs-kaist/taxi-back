const {
  generateUser,
  generateRoom,
  generateSampleLocations,
  generateChats,
} = require("./src/testData");

const mongoose = require("./src/db/mongo");

const { loadSampleData, numberOfRooms, numberOfChats } = require("./security");

const main = async () => {
  await mongoose.connection.db.dropDatabase();

  const { users, locations } = await Promise.resolve(loadSampleData);

  const userOids = [];
  const roomOids = [];

  for (const [index, user] of users.entries()) {
    const userOid = await generateUser(user.id, index + 1, user.isAdmin);
    userOids.push(userOid);
  }

  const sampleLocationOids = await generateSampleLocations(locations);

  for (const index of Array(numberOfRooms).keys()) {
    const roomOid = await generateRoom(
      sampleLocationOids,
      index + 1,
      7,
      userOids[0]
    ); //하드코딩: 일주일 뒤에 출발하는 방(들)을 만듭니다.
    roomOids.push(roomOid);
  }

  for (const roomOid of roomOids) {
    await generateChats(roomOid, userOids, numberOfChats);
  }
  console.log("끝! 스크립트 실행을 중단하셔도 됩니다.");
  process.exit(0);
};

const database = mongoose.connection;
database.on("open", main);
