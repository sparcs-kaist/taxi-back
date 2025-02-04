const { userModel, roomModel, chatModel } = require("../modules/stores/mongo");
const logger = require("../modules/logger");
const { emitChatEvent } = require("../modules/socket");

const MS_PER_MINUTE = 60000;

// 탑승자가 1명인 상태로 탑승일이 지난 방에 대해서 정산 완료 처리
module.exports = (app) => async () => {
  try {
    const io = app.get("io");
    const expiredDate = new Date(Date.now() - 90 * MS_PER_MINUTE).toISOString();
    const arrivalDate = new Date(Date.now() - 60 * MS_PER_MINUTE).toISOString();

    const candidateRooms = await roomModel.find({
      $and: [
        { time: { $gte: expiredDate } },
        { time: { $lte: arrivalDate } },
        { "part.0": { $exists: true }, "part.1": { $exists: false } },
        { "part.0.settlementStatus": { $nin: ["paid", "sent"] } },
      ],
    });

    await Promise.all(
      candidateRooms.map(async ({ _id: roomId, time, part }) => {
        const countArrivalChat = await chatModel.countDocuments({
          roomId,
          type: "arrival",
        });
        if (countArrivalChat > 0) return;
        const minuteDiff = Math.floor((Date.now() - time) / MS_PER_MINUTE);
        if (minuteDiff <= 0) return;
        await emitChatEvent(io, {
          roomId: roomId,
          type: "arrival",
          content: minuteDiff.toString(),
        });
        // user에게 doneroom 으로 이전
        const user = await userModel.findById(part[0].userId);
        user.doneRooms.push(roomId);

        const userOngoingRoomIndex = user.ongoingRoom.indexOf(roomId);
        if (userOngoingRoomIndex === -1) {
          await user.save();
          return false;
        }
        user.ongoingRoom.splice(userOngoingRoomIndex, 1);

        await user.save();

        // room에 대한 정산 완료 처리 isOver
        await roomModel.findByIdAndUpdate(roomId, { isOver: true });
      })
    );
  } catch (err) {
    logger.error(err);
  }
};
