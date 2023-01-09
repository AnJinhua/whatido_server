const express = require("express");
const router = express.Router()
const storiesRoutes = express.Router()
const passport = require("passport");
const StoriesController = require('../controllers/stories')
const { storyUploader } = require("../controllers/uploaderController");
const requireAuth = passport.authenticate("jwt", { session: false });
router.use("/stories", storiesRoutes);
//create story
storiesRoutes.post(
    '/create',
    requireAuth,
    storyUploader.fields([
        { name: 'story', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 },
    ]),
    StoriesController.createStory
)
//view story
storiesRoutes.put('/view/:id', StoriesController.viewUserStory)
// upload images to cloudinary
// storiesRoutes.post('/uploadImage', StoriesController.uploadStoryImage)
//uploa Video file to cloudinary
storiesRoutes.post(
    '/s3upload',
    requireAuth,
    storyUploader.fields([{ name: 'file', maxCount: 1 }]),
    StoriesController.uploadS3
)

//get user stories by userSlug
storiesRoutes.get('/:userSlug', StoriesController.getAllUserStories)

//send email notification for story reply
storiesRoutes.post(
    '/notification/email',
    // requireAuth,
    StoriesController.sendEmailNotification
)
//get stories by :id
storiesRoutes.get('/story/:id', StoriesController.getStoryById)
storiesRoutes.get(
    '/community/:community',
    StoriesController.getCommunityStory
)
storiesRoutes.delete('/:id', StoriesController.deleteStory)
storiesRoutes.get('/your/:slug', StoriesController.getYourStories)
module.exports = router
