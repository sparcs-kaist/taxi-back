const {
  generateUser,
  generateRoom,
  generateSampleLocations,
  generateChats,
} = require("./src/testData");

const security = require("./security");

const main = async () => {
  const userIds = ["sunday", "monday", "tuesday", "wednesday"];
  const numberOfRooms = security.numberOfRooms;
  const numberOfChats = security.numberOfChats;
  const userOids = [];
  const roomOids = [];
  for (const userId of userIds) {
    const userOid = await generateUser(userId);
    userOids.push(userOid);
  }

  const { fromOid, toOid } = await generateSampleLocations();

  for (const i of Array(numberOfRooms).keys()) {
    const roomOid = await generateRoom(fromOid, toOid, i + 1, userOids, 7);
    roomOids.push(roomOid);
  }

  for (const roomOid of roomOids) {
    await generateChats(roomOid, numberOfChats);
  }
  console.log("끝!");
};

main();
