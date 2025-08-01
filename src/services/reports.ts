import type { RequestHandler } from "express";
import { userModel, reportModel, roomModel } from "@/modules/stores/mongo";
import { reportPopulateOption } from "@/modules/populates/reports";
import { sendReportEmail } from "@/modules/email";
import logger from "@/modules/logger";
import reportEmailPage from "@/views/reportEmailPage";
import { notifyReportToReportChannel } from "@/modules/slackNotification";
import type { CreateBody } from "@/routes/docs/schemas/reportsSchema";

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

    notifyReportToReportChannel(user.nickname, report);

    if (report.type === "no-settlement" || report.type === "no-show") {
      const emailHtml = reportEmailPage[report.type](
        req.origin ?? "https://taxi.sparcs.org",
        reported.name,
        reported.nickname,
        room.name,
        user.nickname,
        room._id.toString()
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
        .populate(reportPopulateOption),
      reported: await reportModel
        .find({ reportedId: user._id })
        .limit(1000)
        .populate(reportPopulateOption),
    };
    return res.json(response);
  } catch (err) {
    logger.error(err);
    return res.status(500).send("Reports/searchByUser : internal server error");
  }
};
