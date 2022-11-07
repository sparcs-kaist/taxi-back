const { userModel, reportModel } = require("../db/mongo");
const logger = require("../modules/logger");

const reportPopulateOption = [
  {
    path: "reportedId",
    select: "_id id name nickname profileImageUrl",
  },
];
const createHandler = async (req, res) => {
  try {
    const { reportedId, type, etcDetail, time } = req.body;
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
