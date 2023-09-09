const express = require("express");
const AdminJS = require("adminjs");
const { buildFeature } = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const {
  userModel,
  roomModel,
  locationModel,
  chatModel,
  reportModel,
  adminIPWhitelistModel,
  adminLogModel,
  deviceTokenModel,
  notificationOptionModel,
} = require("../modules/stores/mongo");
const { eventMode } = require("../../loadenv");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middlewares/authAdmin"));
router.use(require("../middlewares/auth"));

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

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
const resourceWrapper = (resource) => ({
  resource,
  features: [
    buildFeature({
      actions: ["list", "show", "new", "edit", "delete", "bulkDelete"].reduce(
        (before, actionName) => ({
          ...before,
          [actionName]: {
            after: logAction(actionName),
          },
        }),
        {}
      ),
    }),
  ],
});

const baseResources = [
  userModel,
  roomModel,
  locationModel,
  chatModel,
  reportModel,
  adminIPWhitelistModel,
  adminLogModel,
  deviceTokenModel,
  notificationOptionModel,
];
const resources = baseResources.concat(
  (() => {
    if (eventMode === "2023fall") {
      return require("../lottery").models;
    } else {
      return [];
    }
  })()
);

// Create router for admin page
const adminJS = new AdminJS({
  resources: resources.map(resourceWrapper),
});
router.use(AdminJSExpress.buildRouter(adminJS));

module.exports = router;
