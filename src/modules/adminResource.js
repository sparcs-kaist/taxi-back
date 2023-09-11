const { buildFeature } = require("adminjs");
const { adminLogModel } = require("./stores/mongo");

const createLog = async (req, action, target) => {
  const newLog = new adminLogModel({
    user: req.userOid, // Log 취급자 User
    time: req.timestamp, // Log 발생 시각
    ip: req.clientIP, // 접속 IP 주소
    target, // 처리한 정보주체 정보
    action, // 수행 업무
  });
  await newLog.save();
};

const generateTarget = (context, isList) => {
  const modelName = context?.resource?.MongooseModel?.modelName;
  const recordLength = `(length = ${context?.records?.length})`;
  const recordId = `(_id = ${context?.record?.params?._id})`;

  return isList
    ? `List<${modelName}>${recordLength}`
    : `${modelName}${recordId}`;
};

const defaultActionAfterHandler = (actionName) => async (res, req, context) => {
  if (
    ["new", "edit", "bulkDelete"].includes(actionName) &&
    req.method !== "post"
  )
    return res; // 왜 필요한건지는 잘 모르겠으나, 기존에 존재하던 코드라 지우지 않고 유지합니다.

  const [action, isList] = {
    list: ["read", true],
    show: ["read", false],
    new: ["create", false],
    edit: ["update", false],
    delete: ["delete", false],
    bulkDelete: ["delete", true],
  }?.[actionName];

  const target = generateTarget(context, isList);
  await createLog(req, action, target);

  return res;
};

const defaultActionLogFeature = buildFeature({
  actions: ["list", "show", "new", "edit", "delete", "bulkDelete"].reduce(
    (before, actionName) => ({
      ...before,
      [actionName]: {
        after: defaultActionAfterHandler(actionName),
      },
    }),
    {}
  ),
});

const recordActionAfterHandler = (actions) => async (res, req, context) => {
  const actionsWrapper = Array.isArray(actions) ? actions : [actions];
  for (const action of actionsWrapper) {
    if (typeof action === "string") {
      const target = generateTarget(context, false);
      await createLog(req, action, target);
    } else {
      await createLog(req, action.action, action.target(res, req, context));
    }
  }

  return res;
};

const recordAction = (actionName, handler, logActions) => ({
  actionName,
  actionType: "record",
  component: false,
  handler,
  after: recordActionAfterHandler(logActions),
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
    features: features.concat([defaultActionLogFeature]),
  });

module.exports = {
  generateTarget,
  recordAction,
  buildResource,
};
