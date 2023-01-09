const express = require("express");
const PushNotificationController = require('../controllers/pushNotification')
const emailNotificationsController = require('../controllers/emailNotificationsController')
const router = express.Router()
const pushNotificationRoutes = express.Router()
const notificationRoutes = express.Router()
const emailNotificationRoutes = express.Router()

//= =========================
// Push Notification Routes
//= =========================
router.use("/push-notification", pushNotificationRoutes);

// Save subscription to database
pushNotificationRoutes.post(
  "/subscribe",
  PushNotificationController.subscribeUser
);

// Send push notification to user
pushNotificationRoutes.post("/notify", PushNotificationController.notifyUser);

// Send push notification to all subscribers
pushNotificationRoutes.post(
  "/notifyAllSubscribers",
  PushNotificationController.notifyAllSubscribers
);

//= ========================
// Notification Routes
// = ========================
router.use("/notifications", notificationRoutes);


notificationRoutes.get(
  "/:userSlug",
  PushNotificationController.getNotifications
);

notificationRoutes.get(
  "/unread/:userSlug",
  PushNotificationController.findUnreadNotifications
);

notificationRoutes.put(
  "/:userSlug",
  PushNotificationController.updateNotifications
);


router.use("/email-notifications", emailNotificationRoutes);

emailNotificationRoutes.post(
  "/new-message",
  emailNotificationsController.newMessageNotifications
);
emailNotificationRoutes.post(
  "/zoom-invite",
  emailNotificationsController.sendZoomEmailNotification
);
emailNotificationRoutes.post(
  "/audio-room-invite",
  emailNotificationsController.sendAudioRoomEmailNotification
);
emailNotificationRoutes.post(
  "/story-reply",
  emailNotificationsController.sendStoryReplyNotification
);

module.exports = router


