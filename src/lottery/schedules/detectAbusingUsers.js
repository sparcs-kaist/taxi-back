const { eventStatusModel } = require("../modules/stores/mongo");
const {
  roomModel,
  chatModel,
  reportModel,
} = require("../../modules/stores/mongo");
const {
  notifyAbuseDetectionResultToReportChannel,
} = require("../modules/slackNotification");
const logger = require("../../modules/logger");

const { eventConfig } = require("../../../loadenv");
const eventPeriod = eventConfig && {
  startAt: new Date(eventConfig.period.startAt),
  endAt: new Date(eventConfig.period.endAt),
};

/**
 * 매일 새벽 4시에 어뷰징 사용자를 감지하고, Slack을 통해 관리자에게 알림을 전송합니다.
 * Original Idea by chlehdwon
 *
 * 성능면에서 상당히 죄책감이 드는 코드이지만, 새벽에 동작하니 괜찮을 것 같습니다... :(
 */

// 두 ObjectId가 같은지 비교하는 함수
const equalsObjectId = (a) => (b) => a.equals(b);

// ObjectId의 배열에서 중복을 제거하는 함수
const removeObjectIdDuplicates = (array) => {
  return array.filter(
    (element, index) => array.findIndex(equalsObjectId(element)) === index
  );
};

module.exports = async () => {
  try {
    logger.info("Abusing user detection started");

    const candidateUsers = await eventStatusModel.find({}, "userId").lean();
    const candidateUserIds = candidateUsers.map((user) => user.userId);

    // 기준 1. "기타 사유"로 신고받은 사용자
    const reports = await reportModel.aggregate([
      {
        $match: {
          reportedId: { $in: candidateUserIds },
          type: "etc-reason",
          time: { $gte: eventPeriod.startAt, $lt: eventPeriod.endAt },
        },
      },
    ]);
    const reportedUsers = reports.reduce((obj, report) => {
      if (!obj[report.reportedId]) {
        obj[report.reportedId] = [];
      }

      obj[report.reportedId].push(report);
      return obj;
    }, {});

    // 기준 2. 하루에 탑승 기록이 많은 사용자
    const rooms = await roomModel.aggregate([
      {
        $match: {
          part: { $elemMatch: { user: { $in: candidateUserIds } } }, // 방 참여자 중 후보자가 존재
          "part.1": { $exists: true }, // 방 참여자가 2명 이상
          time: { $gte: eventPeriod.startAt, $lt: eventPeriod.endAt },
          settlementTotal: { $gt: 0 },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: {
              date: "$time",
              format: "%Y-%m-%d",
              timezone: "+09:00",
            },
          },
          users: { $push: "$part.user" },
        },
      },
      {
        $project: {
          users: {
            $reduce: {
              input: "$users",
              initialValue: [],
              in: { $concatArrays: ["$$value", "$$this"] },
            },
          },
        },
      },
    ]);
    const multiplePartUserIds = rooms.reduce(
      (array, { users }) =>
        array.concat(
          removeObjectIdDuplicates(users).filter(
            (userId) =>
              users.findIndex(equalsObjectId(userId)) ===
              users.findLastIndex(equalsObjectId(userId)) // 두 값이 다르면 중복된 값이 존재함
          )
        ),
      []
    );

    // 기준 3. 채팅 개수가 5개 미만인 방에 속한 사용자
    const chats = await chatModel.aggregate([
      {
        $match: {
          time: { $gte: eventPeriod.startAt, $lt: eventPeriod.endAt },
        },
      },
      {
        $group: {
          _id: "$roomId",
          count: { $sum: 1 },
        },
      },
      {
        $match: {
          count: { $lt: 5 },
        },
      },
    ]);
    const lessChatRooms = await Promise.all(
      chats.map(async ({ _id: roomId, count }) => {
        const room = await roomModel.findById(roomId).lean();
        if (
          eventPeriod.startAt > room.time ||
          eventPeriod.endAt <= room.time ||
          room.settlementTotal <= 0
        )
          return null;

        const targetUsers = room.part
          .map((part) => part.user)
          .filter((userId) => candidateUserIds.some(equalsObjectId(userId)));
        if (targetUsers.length <= 0) return null;

        return {
          roomId,
          chatCount: count,
          targetUsers,
        };
      })
    );
    const lessChatUsers = lessChatRooms.reduce((obj, room) => {
      if (!room) return obj;

      room.targetUsers.forEach((userId) => {
        if (!obj[userId]) {
          obj[userId] = [];
        }

        obj[userId].push({
          roomId: room.roomId,
          chatCount: room.chatCount,
        });
      });
      return obj;
    }, {});

    // 기준 1 ~ 기준 3 중 하나라도 해당되는 사용자
    const abusingUsers = removeObjectIdDuplicates(
      Object.keys(reportedUsers)
        .concat(multiplePartUserIds)
        .concat(Object.keys(lessChatUsers))
    );

    logger.info("Abusing user detection successfully finished");
    logger.info(
      `${abusingUsers.length} users detected! Refer to Slack for more information`
    );

    // Slack으로 알림 전송
    notifyAbuseDetectionResultToReportChannel(
      abusingUsers,
      reports,
      reportedUserIds,
      multiplePartUserIds,
      lessChatUsers
    );
  } catch (err) {
    logger.error(err);
    logger.error("Abusing user detection failed");
  }
};
