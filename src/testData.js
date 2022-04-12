const {
  userModel,
  roomModel,
  locationModel,
  chatModel,
} = require("./db/mongo");
const security = require("../security");

const generateUser = async (id, num) => {
  const newUser = new userModel({
    id: id,
    name: `${id}-name`,
    nickname: `${id}-nickname`,
    profileImageUrl: "public/profile-images/default/sample.png", //hardcoded
    joinat: Date.now(),
    subinfo: {
      kaist: new String(20220000 + num),
      sparcs: "",
      facebook: "",
      twitter: "",
    },
    email: `${id}@kaist.ac.kr`,
  });
  await newUser.save();
  return newUser._id;
};

const generateSampleLocations = async () => {
  const newFrom = new locationModel({
    name: security.fromLocation,
  });
  const newTo = new locationModel({
    name: security.toLocation,
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
    text: `${user.nickname}님이 ${isJoining ? "입장" : "퇴장"}했습니다.`,
    time: time,
  });
  await newChat.save();
};

const generateChats = async (roomId, numOfChats) => {
  const roomPopulateQuery = [{ path: "part", select: "id name nickname -_id" }];
  const room = await roomModel
    .findById(roomId)
    .lean()
    .populate(roomPopulateQuery);

  const userIdsInRoom = [];
  const userIdsOutRoom = room.part;
  let lastTime = Date.now();
  const maximumIntervalBtwChats = 1000 * security.maximumIntervalBtwChats; //Default: 20,000 milliseconds
  let occurenceOfJoin = security.occurenceOfJoin; //Default: 10%
  let occurenceOfAbort = security.occurenceOfAbort; //Default: 10%, 즉 새로운 하나의 채팅 메시지가 입/퇴장 메시지 중 하나일 확률은 20%

  for (const i of Array(numOfChats).keys()) {
    lastTime += Math.floor(Math.random() * maximumIntervalBtwChats);
    const event = Math.random();

    if (
      userIdsInRoom.length === 0 ||
      (event < occurenceOfJoin && userIdsOutRoom.length !== 0)
    ) {
      // 더 들어올 사용자가 있을 경우, 더 들어옴
      const authorIdx = Math.floor(Math.random() * userIdsOutRoom.length);
      const user = userIdsOutRoom[authorIdx];
      await generateJoinAbortChat(roomId, user, true, lastTime);
      userIdsInRoom.push(user);
      userIdsOutRoom.splice(authorIdx, 1);
    } else if (
      occurenceOfJoin <= event &&
      event < occurenceOfJoin + occurenceOfAbort &&
      userIdsInRoom.length > 1
    ) {
      // 나갈 사용자가 있을 경우, 나감
      const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
      const user = userIdsInRoom[authorIdx];
      await generateJoinAbortChat(roomId, user, false, lastTime);
      userIdsOutRoom.push(user);
      userIdsInRoom.splice(authorIdx, 1);
    } else {
      // 방이 비어있지 않을 경우, 채팅 메시지를 만듦
      if (userIdsInRoom.length !== 0) {
        const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
        const user = userIdsInRoom[authorIdx];
        await generateNormalChat(i, roomId, user, lastTime);
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
