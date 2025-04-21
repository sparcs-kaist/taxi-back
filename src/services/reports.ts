import { RequestHandler } from "express";
import { userModel, reportModel, roomModel } from "@/modules/stores/mongo";
import { reportPopulateOption } from "@/modules/populates/reports";
import { sendReportEmail } from "@/modules/email";
import logger from "@/modules/logger";
import reportEmailPage from "@/views/reportEmailPage";
import { notifyReportToReportChannel } from "@/modules/slackNotification";
import { ReportsCreate } from "@/routes/docs/schemas/reportsSchema";

export const createHandler: RequestHandler = async (req, res) => {
  try {
    const { reportedId, type, etcDetail, time, roomId } = req.body as ReportsCreate;
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

    notifyReportToReportChannel(user.nickname, report);

    if (report.type === "no-settlement" || report.type === "no-show") {
      const emailRoomName = room ? room.name : "";
      const emailRoomId = room ? room._id : "";
      const emailHtml = reportEmailPage[report.type](
        req.origin,
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

export const searchByUserHandler: RequestHandler = async (req, res) => {
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
