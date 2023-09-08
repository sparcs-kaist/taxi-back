const { itemModel } = require("../modules/stores/mongo");
const logger = require("../../modules/logger");

const listHandler = async (_, res) => {
  try {
    const items = await itemModel.find(
      {},
      "name imageUrl price description isDisabled stock"
    );
    res.json({ items });
  } catch (err) {
    logger.error(err);
    res.status(500).json({ error: "items/list : internal server error" });
  }
};

module.exports = {
  listHandler,
};
