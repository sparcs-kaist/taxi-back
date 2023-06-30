const { roomModel } = require("../modules/stores/mongo");
const { roomPopulateOption } = require("../modules/populates/rooms");
const { emitChatEvent } = require("../modules/socket");

// const expression = "*/5 * * * *";
const expression = "* * * * *";
const MS_PER_MINUTE = 60000;

/**
 * 출발까지 15분 남은 방들에 참여하고 있는 사용자들에게 리마인더 알림을 전송합니다.
 * @summary 메시지는 보내지 않습니다. ㅎㅎ
 * @return {Promise<Number>} 알림 전송에 실패한 기기 수를 반환합니다.
 */

const sendReminder = async (io) => {
  const departDate = new Date(Date.now() + 15 * MS_PER_MINUTE).toISOString();
  const currentDate = new Date(Date.now()).toISOString();

  const roomObjects = await roomModel
    .find({
      $and: [{ time: { $lt: departDate } }, { time: { $gte: currentDate } }],
    })
    .lean()
    .populate(roomPopulateOption);

  if (!roomObjects) {
    return res.status(404).json({
      error: "NotifyBeforeDepartment: cannot find room",
    });
  }

  const roomIds = roomObjects.map((room) => room._id);
  const authorIds = roomObjects.map((room) => room.part[0].user._id);
  roomIds.map(async (roomId, index) => {
    await emitChatEvent(io, {
      roomId: roomId,
      type: "department",
      content: roomId,
      authorId: authorIds[index],
    });
  });
};

module.exports = {
  expression,
  sendReminder,
};
