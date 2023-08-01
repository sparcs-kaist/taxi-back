const {
  userModel,
  reportModel,
  roomModel,
} = require("../modules/stores/mongo");
const { reportPopulateOption } = require("../modules/populates/reports");
const { sendReportEmail } = require("../modules/stores/aws");
const logger = require("../modules/logger");
const emailPage = require("../views/emailNoSettlementPage");
const { notifyToReportChannel } = require("../modules/slackNotification");

const createHandler = async (req, res) => {
  try {
    const { reportedId, type, etcDetail, time, roomId } = req.body;
    const user = await userModel.findOne({ id: req.userId });
    const creatorId = user._id;

    const reported = await userModel.findById(reportedId);
    if (!reported) {
      return res.status(400).json({
        error: "User/report: no corresponding user",
      });
    }

    const report = new reportModel({
      creatorId,
      reportedId,
      type,
      etcDetail,
      time,
    });

    await report.save();

    notifyToReportChannel(user.nickname, report);

    if (report.type === "no-settlement") {
      const room = await roomModel.findById(roomId);
      const emailRoomName = room ? room.name : "";
      const emailRoomId = room ? room._id : "";
      const emailHtml = emailPage(
        reported.name,
        reported.nickname,
        emailRoomName,
        user.nickname,
        emailRoomId
      );
      sendReportEmail(reported.email, report, emailHtml);
    }

    res.status(200).send("User/report : report successful");
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "User/report : internal server error",
    });
  }
};

const searchByUserHandler = async (req, res) => {
  try {
    // 해당 user가 신고한 사람인지, 신고 받은 사람인지 기준으로 신고를 분리해서 응답을 전송합니다.
    const user = await userModel.findOne({ id: req.userId });
    const response = {
      reporting: await reportModel
        .find({ creatorId: user._id })
        .limit(1000)
        .populate(reportPopulateOption),
      reported: await reportModel
        .find({ reportedId: user._id })
        .limit(1000)
        .populate(reportPopulateOption),
    };
    res.json(response);
  } catch (err) {
    logger.error(err);
    res.status(500).json({
      error: "report/searchByUser : internal server error",
    });
  }
};

module.exports = {
  createHandler,
  searchByUserHandler,
};
