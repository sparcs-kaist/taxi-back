const {
  userModel,
  roomModel,
  locationModel,
  chatModel,
} = require("../../modules/stores/mongo");
const { generateProfileImageUrl } = require("../../modules/modifyProfile");

const {
  maximumIntervalBtwChats,
  occurenceOfJoin,
  occurenceOfAbort,
} = require("../loadenv");

const generateUser = async (id, num, isAdmin) => {
  const newUser = new userModel({
    id: id,
    name: `${id}-name`,
    nickname: `${id}-nickname`,
    profileImageUrl: generateProfileImageUrl(),
    joinat: Date.now(),
    subinfo: {
      kaist: new String(20230000 + num), // ^-^
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
      longitude: location.longitude,
      latitude: location.latitude,
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
    part: [{ user: creatorId }],
    madeat: Date.now(),
    maxPartLength: 4,
  });
  await newRoom.save();
  return newRoom._id;
};

const joinUserToRoom = async (userIdsInRoom, userIdsOutRoom, roomId) => {
  // 들어올 사용자를 무작위로 선택
  const authorIdx = Math.floor(Math.random() * userIdsOutRoom.length);
  const userOid = userIdsOutRoom[authorIdx];

  // 방, 유저 상태 갱신
  userIdsInRoom.push(userOid);
  userIdsOutRoom.splice(authorIdx, 1);
  const user = await userModel.findById(userOid, "ongoingRoom");
  user.ongoingRoom.push(roomId);
  await user.save();

  return { userIdsInRoom, userIdsOutRoom, userOid };
};

const abortUserfromRoom = async (userIdsInRoom, userIdsOutRoom, roomId) => {
  // 나갈 사용자를 무작위로 선택
  const authorIdx = Math.floor(Math.random() * userIdsInRoom.length);
  const userOid = userIdsInRoom[authorIdx];

  // 방, 유저 상태 갱신
  userIdsOutRoom.push(userOid);
  userIdsInRoom.splice(authorIdx, 1);
  const user = await userModel.findById(userOid, "ongoingRoom");
  user.ongoingRoom.splice(user.ongoingRoom.indexOf(roomId), 1);
  await user.save();

  return { userIdsInRoom, userIdsOutRoom, userOid };
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
    content: user._id,
    time: time,
    isValid: false,
  });
  await newChat.save();
};

const generateChats = async (roomId, userOids, numOfChats) => {
  const roomPopulateQuery = [{ path: "part", select: "id name nickname -_id" }];
  const room = await roomModel.findById(roomId).populate(roomPopulateQuery);

  let userIdsInRoom = [];
  let userIdsOutRoom = userOids.map((userOid) => userOid);
  let lastTime = Date.now();
  const maximumIntervalBtwChatsMilliseconds = 1000 * maximumIntervalBtwChats;

  for (const i of Array(numOfChats).keys()) {
    lastTime += Math.floor(Math.random() * maximumIntervalBtwChatsMilliseconds);
    const event = Math.random();

    if (
      userIdsInRoom.length === 0 ||
      (event < occurenceOfJoin && userIdsOutRoom.length !== 0)
    ) {
      // 더 들어올 사용자가 있을 경우, 더 들어옴
      // 방, 유저 상태 갱신
      let userOid;
      ({ userIdsInRoom, userIdsOutRoom, userOid } = await joinUserToRoom(
        userIdsInRoom,
        userIdsOutRoom,
        roomId
      ));
      // 입장 메시지 생성
      await generateJoinAbortChat(roomId, userOid, true, lastTime);
    } else if (
      occurenceOfJoin <= event &&
      event < occurenceOfJoin + occurenceOfAbort &&
      userIdsInRoom.length > 1
    ) {
      // 나갈 사용자가 있을 경우, 나감
      // 방, 유저 상태 갱신
      let userOid;
      ({ userIdsInRoom, userIdsOutRoom, userOid } = await abortUserfromRoom(
        userIdsInRoom,
        userIdsOutRoom,
        roomId
      ));
      // 퇴장 메시지 생성
      await generateJoinAbortChat(roomId, userOid, false, lastTime);
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
  room.part = userIdsInRoom.map((userOid) => {
    return { user: userOid };
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
