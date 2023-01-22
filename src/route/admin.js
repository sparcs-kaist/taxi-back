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
} = require("../db/mongo");

let router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middleware/adminAuth"));

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

// Create router for admin page
const adminJsOptions = {
  resources: [
    userModel,
    roomModel,
    locationModel,
    chatModel,
    reportModel,
    adminIPWhitelistModel,
  ],
};
const adminJs = new AdminJS(adminJsOptions);
router = AdminJSExpress.buildRouter(adminJs, router);

module.exports = router;
