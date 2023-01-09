const NotificationModel = require("../../models/notifications");

const getUserUnreadNotifications = async (req) => {
  try {
    const notifications = await NotificationModel.find({
      receiverSlug: req.params.userSlug,
      read: false,
    });

    return {
      data: notifications,
      error: false,
      message: "success",
      statusCode: 201,
    };
  } catch (error) {
    return {
      data: {},
      error: true,
      message: "Sorry an error occurred",
      statusCode: 500,
    };
  }
};

module.exports = getUserUnreadNotifications;
