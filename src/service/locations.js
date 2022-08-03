const { locationModel } = require("../db/mongo");

const getAllLocationsHandler = async (req, res) => {
  const locations = await locationModel.find({}, { __v: 0 });
  const serverTime = new Date().toISOString();
  res.json({ locations, serverTime });
};

module.exports = {
  getAllLocationsHandler,
};
