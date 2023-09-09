const express = require("express");
const AdminJS = require("adminjs");
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
const { buildResource } = require("../modules/adminResource");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middlewares/authAdmin"));
router.use(require("../middlewares/auth"));

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

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
].map(buildResource());
const resources = baseResources.concat(
  (() => {
    if (eventMode === "2023fall") {
      return require("../lottery").resources;
    } else {
      return [];
    }
  })()
);

// Create router for admin page
const adminJS = new AdminJS({ resources });
router.use(AdminJSExpress.buildRouter(adminJS));

module.exports = router;
