const express = require("express");
const MediaController = require('../controllers/media')
const MediaPostsController = require('../controllers/mediaPosts')
const {messengerUploader,mediaUploader} = require("../controllers/uploaderController");
const router = express.Router()
const mediaRoutes = express.Router()
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });
router.use("/media", mediaRoutes);

//= ========================
// media Routes // The new routes
//= ========================
mediaRoutes.post(
  "/create",
  requireAuth,
  mediaUploader.fields([
    { name: "file", maxCount: 1 },
    { name: "thumbnail", maxCount: 10 },
  ]),
  MediaController.createMedia
);
mediaRoutes.post(
  "/create/web",
  requireAuth,
  mediaUploader.fields([
    { name: "thumbnail", maxCount: 10 },
  ]),
  MediaController.createMediaWeb
);

mediaRoutes.post(
  "/upload",
  requireAuth,
  mediaUploader.single('video'),
  MediaController.uploadMediaWeb
);

mediaRoutes.get("/fetch/:id", MediaController.getMediaPost);
mediaRoutes.get("/all/:userSlug", MediaController.getAllUserMedia);
mediaRoutes.get("/page/:userSlug", MediaController.getPaginatedUserMedia);

mediaRoutes.post("/comment/create", requireAuth, MediaController.createMediaComment);
mediaRoutes.put("/share/:id", requireAuth, MediaController.editMedia);

mediaRoutes.get(
  "/page/comment/:mediaId",
  MediaController.getPaginatedMediaComments
);

mediaRoutes.delete("/:id",requireAuth, MediaController.deleteMedia);
mediaRoutes.delete("/comment/:id",requireAuth, MediaController.deleteMediaComment);

// Getting Media for Landing Page
mediaRoutes.get("/fetchVideos", MediaPostsController.getPaginatedMedia);
mediaRoutes.post("/likeVideo", requireAuth,MediaPostsController.likeVideo);
mediaRoutes.post("/unlikeVideo", requireAuth,MediaPostsController.unlikeVideo);
mediaRoutes.post("/updatePlayCount/:id", MediaController.updatePlayCount);
mediaRoutes.get("/getPlayCount/:id", MediaController.getPlayCount);

module.exports = router