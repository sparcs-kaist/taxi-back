const {
  generateUser,
  generateRoom,
  generateSampleLocations,
  generateChats,
} = require("./src/testData");

const security = require("./security");

const main = async () => {
  const userIds = security.users;
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
    const roomOid = await generateRoom(fromOid, toOid, i + 1, userOids, 7); //하드코딩: 일주일 뒤에 출발하는 방(들)을 만듭니다.
    roomOids.push(roomOid);
  }

  for (const roomOid of roomOids) {
    await generateChats(roomOid, numberOfChats);
  }
  console.log("끝! 스크립트 실행을 중단하셔도 됩니다.");
};

main();
