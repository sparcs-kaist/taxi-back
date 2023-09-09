const express = require("express");
const AdminJS = require("adminjs");
const AdminJSExpress = require("@adminjs/express");
const AdminJSMongoose = require("@adminjs/mongoose");
const {
  eventStatusModel,
  eventModel,
  itemModel,
  transactionModel,
} = require("../modules/stores/mongo");
const { eventMode } = require("../../../loadenv");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../../middlewares/authAdmin"));
router.use(require("../../middlewares/auth"));

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

// Create router for admin page
const adminJS = new AdminJS({
  rootPath: `/events/${eventMode}/admin`,
  resources: [eventStatusModel, eventModel, itemModel, transactionModel],
});
router.use(AdminJSExpress.buildRouter(adminJS));

module.exports = router;
