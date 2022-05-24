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

  for (const [index, userId] of userIds.entries()) {
    const isAdmin = index === 0;
    const userOid = await generateUser(userId, index + 1, isAdmin);
    userOids.push(userOid);
  }

  const { fromOid, toOid } = await generateSampleLocations();

  for (const index of Array(numberOfRooms).keys()) {
    const roomOid = await generateRoom(
      fromOid,
      toOid,
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
};

main();
