const { buildFeature } = require("adminjs");
const { userModel, adminLogModel } = require("./stores/mongo");

// AdminJS에서 Log 저장을 하는 action
const logAction = (actionName) => async (res, req, context) => {
  const user = await userModel.findOne({ id: req.userId });
  const modelName = context?.resource?.MongooseModel?.modelName;
  const recordLength = `(length = ${context?.records?.length})`;
  const recordId = `(_id = ${context?.record?.params?._id})` || recordLength;
  const [action, target] = {
    list: ["read", `List<${modelName}>${recordLength}`],
    show: ["read", `${modelName}${recordId}`],
    new: ["create", `${modelName}${recordId}`],
    edit: ["update", `${modelName}${recordId}`],
    delete: ["delete", `${modelName}${recordId}`],
    bulkDelete: ["delete", `${modelName}${recordId}`],
  }?.[actionName];

  if (
    ["new", "edit", "bulkDelete"].includes(actionName) &&
    req.method !== "post"
  )
    return res;

  if (user?._id && action && target) {
    const newLog = new adminLogModel({
      user: user._id, // Log 취급자 User
      time: req.timestamp, // Log 발생 시각
      ip: req.clientIP, // 접속 IP 주소
      target, // 처리한 정보주체 정보
      action, // 수행 업무
    });
    await newLog.save();
  }
  return res;
};

// AdminJS에서 Log 기록을 하도록 action을 수정합니다
const logFeature = buildFeature({
  actions: ["list", "show", "new", "edit", "delete", "bulkDelete"].reduce(
    (before, actionName) => ({
      ...before,
      [actionName]: {
        after: logAction(actionName),
      },
    }),
    {}
  ),
});

const recordAction = (actionName, handler) => ({
  actionName,
  actionType: "record",
  component: false,
  handler,
});

const buildResource =
  (actions = [], features = []) =>
  (resource) => ({
    resource,
    options: {
      actions: actions.reduce(
        (before, action) => ({
          ...before,
          [action.actionName]: {
            ...action, // actionName이 포함되는 문제가 있지만 있어도 상관은 없을 것 같습니다.
          },
        }),
        {}
      ),
    },
    features: features.concat([logFeature]),
  });

module.exports = {
  recordAction,
  buildResource,
};
