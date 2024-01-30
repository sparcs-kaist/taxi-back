const { roomModel, chatModel } = require("../modules/stores/mongo");
const { emitChatEvent } = require("../modules/socket");
const logger = require("../modules/logger");
const {settlementHandler} = require("../services/rooms");

const MS_PER_MINUTE = 60000;

/**
 * 주기적으로 출발한 방을 검색하고 처리하는 작업을 수행합니다.
 */
module.exports = (app) => async () => {
    console.log("here!");
    try {
        // 현재 시간을 기준으로 2분 전 시간을 계산
          const twoMinutesAgo = new Date(Date.now() - 2 * MS_PER_MINUTE).toISOString();

        // 출발 시간이 현재 시간 이전인 방을 검색
        const expiredRooms = await roomModel.find({
            time: { $lte: twoMinutesAgo },
        });

        // 검색된 방들에 대한 처리 로직 추가
        for (const room of expiredRooms) {
            const usersInRoom = room.part;
            if (usersInRoom.length === 1) {
                for (const participant of usersInRoom) {
                    // 각 참여자에 대해 처리
                            usersInRoom.
                        // 참여 멤버가 1명인 경우
                        // mockReq 객체를 생성하여 필요한 정보를 전달
                        const mockReq = {
                            body: { roomId: room._id },
                            userId: participant.user.id, // 유저 ID 설정
                            userOid: participant.user._id, // 유저 ObjectId 설정
                            app: { get: () => {} }, // req.app.get("io") 대체
                            timestamp: new Date() // 현재 시간 설정
                        };
                        const mockRes = {
                            status: () => ({ json: () => {} }), // 더미 응답 객체
                            send: () => {}
                        };
    
                        await settlementHandler(mockReq, mockRes);
                        console.log("success! hahahahahaahahaha");
                }
            }
        }
    } catch (err) {
        logger.error(err);
    }
}