const {
  userModel,
  roomModel,
  locationModel,
  chatModel,
} = require("./db/mongo");
const crypto = require("crypto");
const security = require("../security");

//사용 가능한 프로필 이미지 url들
const defaultProfile = [
  "CatGeoul.png",
  "CatGreen.png",
  "CatJabo.png",
  "CatOTL.png",
  "CatTaxi.png",
  "GooseGeoul.png",
  "GooseGreen.png",
  "GooseJabo.png",
  "GooseOTL.png",
  "GooseTaxi.png",
  "NupjukGeoul.png",
  "NupjukGreen.png",
  "NupjukJabo.png",
  "NupjukOTL.png",
  "NupjukTaxi.png",
];

// 기존 프로필 사진의 URI 중 하나를 무작위로 선택해 반환합니다.
const generateProfileImageUrl = () => {
  const ridx = crypto.randomInt(defaultProfile.length);
  return `default/${defaultProfile[ridx]}`;
};

const generateUser = async (id, num, isAdmin) => {
  const newUser = new userModel({
    id: id,
    name: `${id}-name`,
    nickname: `${id}-nickname`,
    profileImageUrl: generateProfileImageUrl(),
    joinat: Date.now(),
    subinfo: {
      kaist: new String(20220000 + num),
      sparcs: "",
      facebook: "",
      twitter: "",
    },
    email: `${id}@kaist.ac.kr`,
    isAdmin: isAdmin,
  });
  await newUser.save();
  return newUser._id;
};

const generateSampleLocations = async (locations) => {
  if (locations.length === 0) {
    console.log("Please provide location(s)!");
  }

  for (const location of locations) {
    const locationDocument = new locationModel({
      koName: location.koName,
      enName: location.enName,
    });
    await locationDocument.save();
  }

  const locationDocuments = await locationModel.find().lean();
  return locationDocuments.map((locationDocument) => locationDocument._id);
};

const generateRoom = async (sampleLocationOids, num, daysAfter, creatorId) => {
  const date = new Date();
  date.setDate(date.getDate() + daysAfter);

  let fromIdx = 0;
  let toIdx = 0;

  while (fromIdx === toIdx) {
    fromIdx = Math.floor(Math.random() * sampleLocationOids.length);
    toIdx = Math.floor(Math.random() * sampleLocationOids.length);
  }

  const newRoom = new roomModel({
    name: `test-${num}`,
    from: sampleLocationOids[fromIdx],
    to: sampleLocationOids[toIdx],
    time: date,
    part: [],
    madeat: Date.now(),
    settlement: {
      studentId: creatorId,
      isSettlement: false,
    },
    maxPartLength: 4,
  });
  await newRoom.save();
  return newRoom._id;
};

const generateNormalChat = async (i, roomId, userOid, time) => {
  const user = await userModel.findById(userOid);
  const newChat = new chatModel({
    roomId: roomId,
    type: "text",
    authorId: user._id,
    content: `안녕하세요! (${i}번째 메시지)`,
    time: time,
    inValid: false,
  });
  await newChat.save();
};

const generateJoinAbortChat = async (roomId, userOid, isJoining, time) => {
  const user = await userModel.findById(userOid);
  const newChat = new chatModel({
    roomId: roomId,
    type: isJoining ? "in" : "out",
    authorId: user._id,
    content: user.id,
    time: time,
    isValid: false,
  });
  await newChat.save();
};

const generateChats = async (roomId, userOids, numOfChats) => {
  const roomPopulateQuery = [{ path: "part", select: "id name nickname -_id" }];
  const room = await roomModel.findById(roomId).populate(roomPopulateQuery);

  const userIdsInRoom = [];
  const userIdsOutRoom = userOids.map((userOid) => userOid);
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
      // 들어올 사용자를 무작위로 선택
      const authorIdx = Math.floor(Math.random() * userIdsOutRoom.length);
      const userOid = userIdsOutRoom[authorIdx];

      // 입장 메시지 생성
      await generateJoinAbortChat(roomId, userOid, true, lastTime);

      // 방, 유저 상태 갱신
      userIdsInRoom.push(userOid);
      userIdsOutRoom.splice(authorIdx, 1);
      const user = await userModel.findById(userOid, "room");
      user.room.push(roomId);
      await user.save();
    } else if (
      occurenceOfJoin <= event &&
      event < occurenceOfJoin + occurenceOfAbort &&
      userIdsInRoom.length > 1
    ) {
      // 나갈 사용자가 있을 경우, 나감
      // 나갈 사용자를 무작위로 선택
      const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
      const userOid = userIdsInRoom[authorIdx];

      // 퇴장 메시지 생성
      await generateJoinAbortChat(roomId, userOid, false, lastTime);

      // 방, 유저 상태 갱신
      userIdsOutRoom.push(userOid);
      userIdsInRoom.splice(authorIdx, 1);
      const user = await userModel.findById(userOid, "room");
      user.room.splice(user.room.indexOf(roomId), 1);
      await user.save();
    } else {
      // 방이 비어있지 않을 경우, 일반 채팅 메시지를 만듦
      if (userIdsInRoom.length !== 0) {
        const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
        const user = userIdsInRoom[authorIdx];
        await generateNormalChat(i, roomId, user, lastTime);
      }
    }
  }
  // 현재 참여중인 사용자 기준으로 방의 part 리스트를 업데이트함
  room.part = userIdsInRoom;
  room.settlement = userIdsInRoom.map((userOid) => {
    return { studentId: userOid, isSettlement: false };
  });
  await room.save();
  return;
};

module.exports = {
  generateUser,
  generateRoom,
  generateSampleLocations,
  generateChats,
};
