const express = require("express");
const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const adminAuthMiddleware = require("../middleware/adminAuth");
const { userModel, roomModel, locationModel } = require("../db/mongo");

let router = express.Router();

// Add middleware for admin check
router.use(adminAuthMiddleware);

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

// Create router for admin page
const adminJsOptions = {
  resources: [userModel, roomModel, locationModel],
};
const adminJs = new AdminJS(adminJsOptions);
router = AdminJSExpress.buildRouter(adminJs, router);

module.exports = router;
