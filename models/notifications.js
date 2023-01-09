const mongoose = require("mongoose");

const notificationSchema = mongoose.Schema(
  {
    title: { type: String, required: true },
    senderSlug: { type: String, required: true },
    receiverSlug: { type: String, required: true },
    read: { type: Boolean, default: false },
    imageUrl: { type: String, default: null },
    endUrl: String,
    btnText: { type: String, default: "view" },
    redirectUrl: { type: String, default: null },
    mediaId: { type: String, default: null },
  },
  { timestamps: true }
);

const NotificationModel = mongoose.model("notification", notificationSchema);

module.exports = NotificationModel;
