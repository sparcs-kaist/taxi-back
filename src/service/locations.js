const { locationModel } = require("../db/mongo");

const getAllLocationsHandler = async (req, res) => {
  const locations = await locationModel.find({}, { _id: 0, __v: 0 });
  res.json(locations);
};

module.exports = {
  getAllLocationsHandler,
};
