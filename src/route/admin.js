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
} = require("../db/mongo");

const router = express.Router();

// Requires admin property of the user to enter admin page.
router.use(require("../middleware/authAdmin"));
router.use(require("../middleware/auth"));

// Registration of the mongoose adapter
AdminJS.registerAdapter(AdminJSMongoose);

const logAction = (actionName) => (response, request, context) => {
  console.log(actionName, request.userId);
  return response;
};

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

// Create router for admin page
const adminJS = new AdminJS({
  resources: [
    userModel,
    roomModel,
    locationModel,
    chatModel,
    reportModel,
    adminIPWhitelistModel,
  ].map(resourceWrapper),
});
router.use(AdminJSExpress.buildRouter(adminJS));

module.exports = router;
