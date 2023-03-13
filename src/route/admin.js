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

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middleware/authAdmin"));

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

// Create router for admin page
const adminJS = new AdminJS({
  resources: [
    userModel,
    roomModel,
    locationModel,
    chatModel,
    reportModel,
    adminIPWhitelistModel,
  ],
});
router.use(AdminJSExpress.buildRouter(adminJS));

module.exports = router;
