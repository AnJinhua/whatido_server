
const authRoutes = require('./auth')
const conversationRoutes = require('./conversation')
const feedRoutes = require('./feed')
const mediaRoutes = require('./media')
const messageRoutes = require('./message')
const notificationRoutes = require('./notification')
const storiesRoutes = require("./story")
const index = require('./index');
const user = require('./user');
const router = require("express").Router();



module.exports = (app) => {
    router.use(index);
    router.use(authRoutes);
    router.use(conversationRoutes);
    router.use(feedRoutes);
    router.use(mediaRoutes);
    router.use(messageRoutes);
    router.use(notificationRoutes);
    router.use(user);
    router.use(storiesRoutes);

    app.use("/", router);
}