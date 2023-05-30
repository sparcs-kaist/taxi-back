const { chatModel, userModel, roomModel } = require("../modules/stores/mongo");
const { emitChatEvent } = require("../modules/socket");

const expression = "*/5 * * * *";
const MS_PER_MINUTE = 60000;

/**
 * 출발까지 15분 남은 방들에 참여하고 있는 사용자들에게 리마인더 알림을 전송합니다.
 * @summary 메시지는 보내지 않습니다. ㅎㅎ
 * @return {Promise<Number>} 알림 전송에 실패한 기기 수를 반환합니다.
 */

const sendReminder = async (req, res) => {
  const currentDate = new Date(Date.now() - 15 * MS_PER_MINUTE).toISOString();

  const roomIds = await roomModel
    .find({ time: { $gte: currentDate } })
    .populate("ongoingRoom");
  console.log(roomIds);

  if (!roomIds) {
    return res.status(404).json({
      error: "NotifyBeforeDepartment: cannot find room",
    });
  }
  // alert to each room object

  await emitChatEvent(req.app.get("io"), {
    roomId: roomModel._id,
    type: "department",
    content: user.id,
  });
  // department 채팅 메세지 유형 추가해야함

  roomIds.map(
    async (roomId) =>
      await emitChatEvent(req.app.get("io"), {
        roomId: roomId,
        type: "department",
        content: user.id,
      })
  );
};

module.exports = {
  expression,
  sendReminder,
};
