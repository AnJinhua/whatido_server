const express = require("express");
const router = express.Router()
const ExpertsController = require("../controllers/experts");
const { resumeUploader,  profileUploader,
} = require("../controllers/uploaderController");
const UserController = require("../controllers/user");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });
const userRoutes = express.Router()
const multer = require("multer");

// storage needed for saving images from forms
const storage = multer.diskStorage({
  destination(req, file, callback) {
    callback(null, "./public/uploads");
  },
  filename(req, file, callback) {
    callback(null, `${Date.now()}-${file.originalname}`);
  },
});

// var upload = multer({ storage : storage}).array('ProfileImage',2);
const upload = multer({ storage }).fields([
  { name: "RelatedImages1", maxCount: 1 },
]); // upload Midleware



// upload images to digitalOcean
// @access Private
router.post(
  "/resume/uploads3",
  resumeUploader.fields([{ name: "file", maxCount: 1 }]),
  ExpertsController.resumeUploadS3
);

  // upload images to digitalOcean
  // @access Private
  router.post(
    "/profile/uploads3",
    requireAuth,
    profileUploader.fields([{ name: "file", maxCount: 1 }]),
    ExpertsController.uploadS3
  );

// profile pic  requireAuth,

router.post("/uploadImage", requireAuth, ExpertsController.uploadImage);

// update user profile
// @access Private
router.post(
  "/userExpertUpdate/:slug",
  // requireAuth,
  profileUploader.fields([{ name: "avatar", maxCount: 1 }, { name: "coverImage", maxCount: 1 }]),
  ExpertsController.userExpertUpdate
);

// delete user account
// @access Private
router.delete(
  "/userExpert/:slug",
  requireAuth,
  ExpertsController.userExpertDelete
);


router.get("/getExpertDetail/:slug", ExpertsController.getExpertDetail);
router.get("/getExpert/:slug", ExpertsController.getExpert);

router.post("/userExpert/", ExpertsController.userExpert);

router.use("/user", userRoutes);

// Set user routes as a subgroup/middleware to router
userRoutes.post(
  "/update-avatar/:slug",
  requireAuth,
  UserController.updateAvatar
);

userRoutes.get("/get-stories/:slug", UserController.getUserStory);
userRoutes.get("/:userId", requireAuth, UserController.viewProfile);
userRoutes.get("/getUserReviews/:userEmail", UserController.getUserReviews);

// @desc    get logged in users with visiblity on
// @route   GET /usersloggedin
// @access  Public
router.get("/loggedIn", UserController.loggedinUsers);
router.post("/saveUserReview/", ExpertsController.saveUserReview);

router.get(
  "/getExpertReviews/:expertSlug",
  ExpertsController.getExpertReviews
);

module.exports = router
