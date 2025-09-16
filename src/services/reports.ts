import type { RequestHandler } from "express";
import {
  userModel,
  reportModel,
  roomModel,
  emailModel,
} from "@/modules/stores/mongo";
import {
  reportPopulateOption,
  type ReportPopulatePath,
} from "@/modules/populates/reports";
import { sendReportEmail } from "@/modules/email";
import logger from "@/modules/logger";
import reportEmailPage from "@/views/reportEmailPage";
import { notifyReportToReportChannel } from "@/modules/slackNotification";
import type { CreateBody } from "@/routes/docs/schemas/reportsSchema";
import { v4 as uuidv4 } from "uuid";

const generateUniqueTrackingId = async () => {
  let trackingId;
  let existingTracking;
  do {
    trackingId = uuidv4();
    existingTracking = await emailModel.findOne({ trackingId });
  } while (existingTracking);
  return trackingId;
};

export const createHandler: RequestHandler = async (req, res) => {
  try {
    const { reportedId, type, etcDetail, time, roomId }: CreateBody = req.body;
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    if (!user) {
      return res.status(400).send("Reports/create : no corresponding user");
    }

    const reported = await userModel.findOne({
      _id: reportedId,
      withdraw: false,
    });
    if (!reported) {
      return res.status(400).send("Reports/create : no corresponding user");
    }

    const room = await roomModel.findById(roomId);
    if (!room) {
      return res.status(400).send("Reports/create : no corresponding room");
    }

    const report = new reportModel({
      creatorId: user._id,
      reportedId,
      type,
      etcDetail,
      time,
      roomId,
    });

    await report.save();

    const trackingId = await generateUniqueTrackingId();

    const email = new emailModel({
      emailAddress: reported.email,
      reportId: report,
      trackingId,
      sentAt: new Date(),
      isOpened: false,
    });

    await email.save();

    notifyReportToReportChannel(user.nickname, report);

    if (report.type === "no-settlement" || report.type === "no-show") {
      const emailHtml = reportEmailPage[report.type](
        reported.name,
        reported.nickname,
        room.name,
        user.nickname,
        room._id.toString(),
        trackingId
      );
      sendReportEmail(reported.email, report, emailHtml);
    }

    return res.status(200).send("Reports/create : report successful");
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Reports/create : internal server error");
  }
};

export const searchByUserHandler: RequestHandler = async (req, res) => {
  try {
    // 해당 user가 신고한 사람인지, 신고 받은 사람인지 기준으로 신고를 분리해서 응답을 전송합니다.
    const user = await userModel.findOne({ _id: req.userOid, withdraw: false });
    if (!user) {
      return res
        .status(400)
        .json({ error: "Reports/searchByUser : no corresponding user" });
    }

    const response = {
      reporting: await reportModel
        .find({ creatorId: user._id })
        .limit(1000)
        .populate<ReportPopulatePath>(reportPopulateOption),
      reported: await reportModel
        .find({ reportedId: user._id })
        .limit(1000)
        .populate<ReportPopulatePath>(reportPopulateOption),
    };
    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Reports/searchByUser : internal server error");
  }
};
