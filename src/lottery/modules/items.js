const { itemModel } = require("./stores/mongo");
const { buildRecordAction } = require("@/modules/adminResource");
const logger = require("@/modules/logger").default;

const addItemStockActionHandler = (count) => async (req, res, context) => {
  const itemId = context.record.params._id;
  const oldStock = context.record.params.stock;

  try {
    const item = await itemModel
      .findOneAndUpdate(
        { _id: itemId },
        {
          $inc: {
            stock: count,
          },
        },
        {
          new: true,
        }
      )
      .lean();
    if (!item) throw new Error("Fail to update stock");

    let record = context.record.toJSON(context.currentAdmin);
    record.params = item;

    return {
      record,
      notice: {
        message: `성공적으로 재고 ${count}개를 추가했습니다. (${oldStock} → ${item.stock})`,
      },
      response: {},
    };
  } catch (err) {
    logger.error(err);
    logger.error(
      `Fail to process addItemStockActionHandler(${count}) for Item ${itemId}`
    );

    return {
      record: context.record.toJSON(context.currentAdmin),
      notice: {
        message: `재고를 추가하지 못했습니다. 오류 메세지: ${err}`,
        type: "error",
      },
    };
  }
};
const addItemStockActionLogs = ["update"];

const addOneItemStockAction = buildRecordAction(
  "addOneItemStock",
  addItemStockActionHandler(1),
  addItemStockActionLogs
);
const addFiveItemStockAction = buildRecordAction(
  "addFiveItemStock",
  addItemStockActionHandler(5),
  addItemStockActionLogs
);

module.exports = {
  addOneItemStockAction,
  addFiveItemStockAction,
};
