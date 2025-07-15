const express = require("express");
const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const {
  userModel,
  banModel,
  roomModel,
  locationModel,
  chatModel,
  reportModel,
  emailModel,
  adminIPWhitelistModel,
  adminLogModel,
  deviceTokenModel,
  notificationOptionModel,
  taxiFareModel,
  noticeModel,
} = require("@/modules/stores/mongo");
const { buildResource } = require("@/modules/adminResource");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("@/middlewares/authAdmin").default);
router.use(require("@/middlewares/auth").default);

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

const resources = [
  userModel,
  banModel,
  roomModel,
  locationModel,
  chatModel,
  reportModel,
  emailModel,
  adminIPWhitelistModel,
  adminLogModel,
  deviceTokenModel,
  notificationOptionModel,
  taxiFareModel,
  noticeModel,
]
  .map(buildResource())
  .concat(require("@/lottery").resources);

// Create router for admin page
const adminJS = new AdminJS({ resources });
router.use(AdminJSExpress.buildRouter(adminJS));

module.exports = router;
