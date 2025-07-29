const {
  userModel,
  reportModel,
  roomModel,
  emailModel,
} = require("@/modules/stores/mongo");
const { reportPopulateOption } = require("@/modules/populates/reports");
const { sendReportEmail } = require("@/modules/email");
const logger = require("@/modules/logger").default;
const reportEmailPage = require("@/views/reportEmailPage").default;
const { notifyReportToReportChannel } = require("@/modules/slackNotification");
const { v4: uuidv4 } = require("uuid");
const { FRONT_URL } = require("@/loadenv");

const generateUniqueTrackingId = async () => {
  let trackingId;
  let existingTracking;
  do {
    trackingId = uuidv4();
    existingTracking = await emailModel.findOne({ trackingId });
  } while (existingTracking);
  return trackingId;
};

const createHandler = async (req, res) => {
  try {
    const { reportedId, type, etcDetail, time, roomId } = req.body;
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    const creatorId = user._id;

    const reported = await userModel.findOne({
      _id: reportedId,
      withdraw: false,
    });
    if (!reported) {
      return res.status(400).json({
        error: "User/report: no corresponding user",
      });
    }

    const room = await roomModel.findById(roomId);
    if (!room) {
      return res.status(400).json({
        error: "User/report: no corresponding room",
      });
    }

    const report = new reportModel({
      creatorId,
      reportedId,
      type,
      etcDetail,
      time,
      roomId,
    });

    await report.save();

    const trackingId = await generateUniqueTrackingId();

    await emailModel.create({
      emailAddress: reported.email,
      reportId: report,
      trackingId,
      sentAt: new Date(),
      isOpened: false,
    });

    notifyReportToReportChannel(user.nickname, report);

    if (report.type === "no-settlement" || report.type === "no-show") {
      const emailRoomName = room ? room.name : "";
      const emailRoomId = room ? room._id : "";
      const emailHtml = reportEmailPage[report.type](
        FRONT_URL,
        reported.name,
        reported.nickname,
        emailRoomName,
        user.nickname,
        emailRoomId,
        trackingId
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
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
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
