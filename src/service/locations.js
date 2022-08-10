const { locationModel } = require("../db/mongo");
const logger = require("../modules/logger");

const getAllLocationsHandler = async (_, res) => {
  try {
    const locations = await locationModel.find({}, { __v: 0 });
    const serverTime = new Date().toISOString();
    res.json({ locations, serverTime });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "Locations/ : internal server error" });
  }
};

module.exports = {
  getAllLocationsHandler,
};
