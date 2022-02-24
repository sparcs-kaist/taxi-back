const {
  userModel,
  roomModel,
  locationModel,
  chatModel,
} = require("./db/mongo");

const generateUser = async (id) => {
  const newUser = new userModel({
    name: `${id}-name`,
    nickname: `${id}-nickname`,
    id: id,
    profileImageUrl: "public/profile-images/default/sample.png", //hardcoded
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

const generateNormalChat = async (i, roomId, user, time) => {
  const newChat = new chatModel({
    roomId: roomId,
    authorId: user.id,
    authorName: user.nickname,
    text: `안녕하세요! (${i}번째 메시지)`,
    time: time,
  });
  await newChat.save();
};

const generateJoinAbortChat = async (roomId, user, isJoining, time) => {
  const newChat = new chatModel({
    roomId: roomId,
    authorId: null,
    authorName: null,
    text: `${user.id}님이 ${isJoining ? "입장" : "퇴장"}했습니다.`,
    time: time,
  });
  await newChat.save();
};

const generateChats = async (roomId, numOfChats) => {
  const roomPopulateQuery = [{ path: "part", select: "id name nickname -_id" }];
  const room = await roomModel.findById(roomId).exec();
  await room.populate(roomPopulateQuery);

  const userIdsInRoom = [];
  const userIdsOutRoom = room.part.map((user) => user.id);

  let lastTime = Date.now();
  const someMinutes = 1000 * 20; //20 seconds
  let occurenceOfJoin = 0.05; //5%
  let occurenceOfAbort = 0.05; //5%, 즉 새로운 하나의 채팅 메시지가 입/퇴장 메시지 중 하나일 확률은 10%

  for (const i of Array(numOfChats).keys()) {
    lastTime += Math.floor(Math.random() * someMinutes);
    const event = Math.random();

    if (event > occurenceOfJoin + occurenceOfAbort) {
      // 방이 비어있지 않을 경우, 채팅 메시지를 만듦
      if (userIdsInRoom.length !== 0) {
        const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
        const user = room.part[authorIdx];
        await generateNormalChat(i, roomId, user, lastTime);
      }
    } else if (event < occurenceOfJoin) {
      // 더 들어올 사용자가 있을 경우, 더 들어옴
      if (userIdsOutRoom.length !== 0) {
        const authorIdx = Math.floor(Math.random() * userIdsOutRoom.length);
        const user = userIdsOutRoom[authorIdx];
        generateJoinAbortChat(roomId, user, true, lastTime);
        userIdsInRoom.push(user);
        userIdsOutRoom.splice(authorIdx, 1);
      }
    } else {
      // 나갈 사용자가 있을 경우, 나감
      if (userIdsInRoom.length > 1) {
        const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
        const user = userIdsOutRoom[authorIdx];
        generateJoinAbortChat(roomId, user, false, lastTime);
        userIdsOutRoom.push(user);
        userIdsInRoom.splice(authorIdx, 1);
      }
    }
  }
  return;
};

module.exports = {
  generateUser,
  generateRoom,
  generateSampleLocations,
  generateChats,
};
