const {
  userModel,
  roomModel,
  locationModel,
  chatModel,
} = require("./db/mongo");
const security = require("../security");

const generateUser = async (id) => {
  const newUser = new userModel({
    name: `${id}-name`,
    nickname: `${id}-nickname`,
    id: id,
    profileImageUrl:
      security.taxiBackDir + "/public/profile-images/default/sample.png", //hardcoded
    room: [],
    joinat: Date.now(),
  });
  await newUser.save();
  return newUser._id;
};

const generateSampleLocations = async () => {
  const newFrom = new locationModel({
    name: "택시승강장",
  });
  const newTo = new locationModel({
    name: "대전역",
  });
  await newFrom.save();
  await newTo.save();

  return {
    fromOid: newFrom._id,
    toOid: newTo._id,
  };
};

const generateRoom = async (from, to, num, users, daysAfter) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAfter);
  const newRoom = new roomModel({
    name: `test-${num}`,
    from: from,
    to: to,
    time: date,
    part: users,
    madeat: Date.now(),
  });
  await newRoom.save();
  return newRoom._id;
};

const generateChats = async (roomId, numOfChats) => {
  const extractLocationName = (location) => location.name;
  const roomPopulateQuery = [
    { path: "part", select: "id name nickname -_id" },
    { path: "from", transform: extractLocationName },
    { path: "to", transform: extractLocationName },
  ];
  const room = await roomModel.findById(roomId).exec();
  await room.populate(roomPopulateQuery);
  let lastTime = Date.now();
  const someMinutes = 1000 * 60; //1 mins

  for (const i of Array(numOfChats).keys()) {
    const authorIdx = Math.floor(Math.random() * room.part.length);
    lastTime += Math.floor(Math.random() * someMinutes);
    const newChat = new chatModel({
      roomId: roomId,
      authorId: room.part[authorIdx].id,
      authorName: room.part[authorIdx].nickname,
      text: `안녕하세요! (${i}번째 메시지)`,
      time: lastTime,
    });
    await newChat.save();
  }
  return;
};

module.exports = {
  generateUser,
  generateRoom,
  generateSampleLocations,
  generateChats,
};
