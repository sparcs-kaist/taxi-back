const { userModel, reportModel } = require("../db/mongo");
const logger = require("../modules/logger");
const awsS3 = require("../db/awsS3");

const reportHandler = async (req, res) => {
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
      creatorId: creatorId,
      reportedId: reportedId,
      type: type,
      etcDetail: etcDetail,
      time: time,
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

module.exports = {
  reportHandler,
};
