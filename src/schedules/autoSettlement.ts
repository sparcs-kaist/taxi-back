import type { Express } from "express";
import { emitChatEvent } from "@/modules/socket";
import { userModel, roomModel } from "@/modules/stores/mongo";
import logger from "@/modules/logger";

const MS_PER_MINUTE = 60000;

// 탑승자가 1명인 상태로 탑승 시간이 지난 방에 대해서 정산 완료 처리
const autoSettlement = (app: Express) => async () => {
  try {
    const io = app.get("io");
    const expiredDate = new Date(Date.now() - 60 * MS_PER_MINUTE).toISOString();
    const arrivalDate = new Date(Date.now()).toISOString();
    const candidateRooms = await roomModel.find({
      $and: [
        { time: { $gte: expiredDate } },
        { time: { $lte: arrivalDate } },
        { "part.0": { $exists: true }, "part.1": { $exists: false } },
        { "part.0.settlementStatus": { $nin: ["paid", "sent"] } }, // "sent"의 경우 로직상 불가능 하지만, 문서화 측면에서 의도적으로 남겨두었음.
      ],
    });

    await Promise.all(
      candidateRooms.map(async ({ _id: roomId, part }) => {
        const user = await userModel.findById(part![0].user._id);
        // 정산 채팅을 보냅니다.
        await emitChatEvent(io, {
          roomId: roomId.toString(),
          type: "settlement",
          content: user!.id,
          authorId: user!._id.toString(),
        });

        // 1명의 참여자만 존재하는 room에 대하여 정산 완료 처리.
        await roomModel.findByIdAndUpdate(roomId, {
          ["part.0.settlementStatus"]: "paid",
          settlementTotal: 1,
        });

        // Atomic update로 각 Room을 한번에 제거 및 추가함.
        // 아토믹하게 처리하지 않을 경우 각 Promise가 동일한 user의 여러 ongoingRoom 또는 doneRoom을 동시에 수정하여 경합조건이 발생할 수 있음에 유의.
        await userModel.findByIdAndUpdate(user!._id, {
          $pull: { ongoingRoom: roomId },
          $push: { doneRoom: roomId },
        });
      })
    );
  } catch (err) {
    logger.error(err);
  }
};

export default autoSettlement;
