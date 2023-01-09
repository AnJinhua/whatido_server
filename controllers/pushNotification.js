require('dotenv').config()
const webpush = require("web-push");
const cron = require("node-cron");
const EndpointModel = require("../models/endpoint");
const NotificationModel = require("../models/notifications");
const getEndpoints = require("../services/push-notification/checkSubscription");
const getUserEndpoints = require("../services/push-notification/userEndpoints");
const getAllSubscriptions = require("../services/push-notification/allEndpoints");
const getUserUnreadNotifications = require("../services/push-notification/notifications");

const  MAILTO  = process.env.MAILTO
const  WEBPUSH_PUBLIC_KEY = process.env.WEBPUSH_PUBLIC_KEY
const  WEBPUSH_PRIVATE_KEY = process.env.WEBPUSH_PRIVATE_KEY

exports.subscribeUser = async (req, res) => {
  const subscription = req.body.subscription;

  const { data } = await getEndpoints(subscription?.endpoint);

  if (req.body.userSlug) {
    if (data.length > 0) {
      data.map(async ({ userSlug, _id }) => {
        try {
          if (userSlug === req.body.userSlug) {
            console.log("USER ALREADY SUBSCRIBED");
          } else {
            await EndpointModel.updateOne(
              { _id: _id },
              { $set: { userSlug: req.body.userSlug } }
            );
          }
        } catch (error) {
          console.log("error", error);
        }
      });
    } else {
      // if no endpoints found
      const newEndpoint = new EndpointModel({
        endpoint: subscription.endpoint,
        subscription,
        userSlug: req.body.userSlug,
      });

      try {
        await newEndpoint.save();
        res.status(201).json(newEndpoint);
      } catch (error) {
        res.status(409).json({ message: error.message });
      }
    }
  } else {
    // if no userSlug
    if (data.length > 0) {
      data.map(async ({ _id }) => {
        try {
          await EndpointModel.findByIdAndDelete({ _id: _id });
        } catch (error) {
          console.log("error", error);
        }
      });
    }
  }
};

webpush.setVapidDetails(MAILTO, WEBPUSH_PUBLIC_KEY, WEBPUSH_PRIVATE_KEY);

exports.notifyUser = async (req, res) => {
  const payload = req.body;

  const pushPayload = JSON.stringify({
    title: payload.title,
    description: payload.description,
    userSlug: payload.userSlug,
    action: payload.action,
    destinationUrl: payload.endUrl,
  });

  const newNotification = new NotificationModel({
    title: payload.title,
    senderSlug: payload.senderSlug,
    receiverSlug: payload.userSlug,
    imageUrl: payload.imageUrl,
    endUrl: payload.endUrl,
    btnText: payload.action,
    redirectUrl: payload.redirectUrl,
    mediaId: payload?.mediaId,
  });

  try {
    await newNotification.save();
  } catch (error) {
    res.status(409).json({ message: error.message });
  }

  if (payload.userSlug !== "" || payload.userSlug !== undefined) {
    const getAllEndpoints = await getUserEndpoints(payload.userSlug);
    const userEndpoints = getAllEndpoints.data;

    userEndpoints.map(({ subscription }) => {
      webpush
        .sendNotification(subscription, pushPayload)
        .catch((err) => console.log(err));
    });
  }

  res.send("Notification sent!");
};

// send push notification to all subscribed users
exports.notifyAllSubscribers = async (req, res) => {
  const payload = req.body;

  const allEndpoints = await getAllSubscriptions(payload.userSlug);
  const endpoints = allEndpoints.data;
  let newArray = [];
  try {
    // avoid duplicate entries
    endpoints.map(({ userSlug }) => {
      if (newArray.includes(userSlug)) {
        return;
      } else {
        newArray.push(userSlug);
      }
    });

    for (let i = 0; i < newArray.length; i++) {
      const newNotification = new NotificationModel({
        title: payload.title,
        senderSlug: payload.senderSlug,
        receiverSlug: newArray[i],
        endUrl: payload.endUrl,
        btnText: payload.action,
        redirectUrl: payload.redirectUrl,
      });

      await newNotification.save();
    }
  } catch (error) {
    res.status(409).json({ message: error.message });
  }

  const pushPayload = JSON.stringify({
    title: payload.title,
    action: payload.action,
    destinationUrl: payload.endUrl,
  });

  try {
    endpoints.map(({ subscription }) => {
      webpush
        .sendNotification(subscription, pushPayload)
        .catch((err) => console.log(err));
    });
  } catch (error) {
    console.log(error);
  }
};

// get notifications for a user
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await NotificationModel.find({
      receiverSlug: req.params.userSlug,
    })
      .sort({ createdAt: -1 })
      .skip(req.query.page * 10)
      .limit(10);

    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json(error);
  }
};

exports.updateNotifications = async (req, res) => {
  const { data } = await getUserUnreadNotifications(req);

  data.map(async ({ _id, read }) => {
    try {
      await NotificationModel.updateOne({ _id: _id }, { $set: { read: true } });
    } catch (error) {
      console.log("error", error);
    }
  });
};

exports.findUnreadNotifications = async (req, res) => {
  try {
    const { data } = await getUserUnreadNotifications(req);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json(error);
  }
};

// deletes all read notifications from 12hrs ago
cron.schedule("0 0 * * *", async () => {
  try {
    await NotificationModel.deleteMany({
      read: true,
      createdAt: { $lte: new Date(Date.now() - 12 * 60 * 60 * 1000) },
    });
  } catch (error) {
    console.log(error);
  }
});

// cron job that deletes subscriptions that are upto 48 hours
cron.schedule("0 0 * * *", async () => {
  try {
    await EndpointModel.deleteMany({
      createdAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) },
    });
  } catch (error) {
    console.log(error);
  }
});
