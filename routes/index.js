const express = require("express");
const router = express.Router()
const ExpertsController = require("../controllers/experts");
const CommentController = require("../controllers/comment");
const followController = require("../controllers/follow");
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });


//= ========================
// Experts Routes
//= ========================

router.get(
  "/getExpertsCategoryList",
  ExpertsController.getExpertsCategoryList
);
router.get(
  "/getExpertsSubCategoryList/:category",
  ExpertsController.getExpertsSubCategoryList
);
router.get(
  "/getExpertReviews/:expertSlug",
  ExpertsController.getExpertReviews
);
router.get(
  "/getExpertsListing/:category",
  ExpertsController.getExpertsListing
);
router.get(
  "/getExpertsListingByKeyword/:keyword",
  ExpertsController.getExpertsListingByKeyword
);

//= ========================
// follow Routes
//= ========================
// follow a user or community
router.post("/follow/:peer", requireAuth, followController.follow);
// unfollow a user or community
router.post("/unfollow/:peer", requireAuth, followController.unfollow);
// get list of users or communities that you are following 
router.get("/following/:slug", followController.getfollowing);
//  get list of users following you
router.get("/follwers/:slug", followController.getfollower);
router.get("/checkfollowing/:slug/:peer", followController.checkfollowing);

//= ========================
// Comment Routes
//= ========================
router.get("/getComments/:slug", CommentController.getComments);
router.post("/get-replies", CommentController.getReplies);
router.post("/delete-reply", CommentController.deleteReply);
router.post("/addComment", CommentController.addComment);
router.post("/updateComment", CommentController.updateComment);
router.post("/deleteComment", CommentController.deleteComment);
router.post("/likeComment", CommentController.likeComment);
router.post("/dislikeComment", CommentController.dislikeComment);

//= ========================
// Experts Routes
//= ========================

router.get(
  "/getExpertsCategoryList",
  ExpertsController.getExpertsCategoryList
);
router.get(
  "/getExpertsSubCategoryList/:category",
  ExpertsController.getExpertsSubCategoryList
);

router.get("/online-friend/:slug",ExpertsController.getUserFriendsOnlineStatus)
router.get("/online/:slug",ExpertsController.getUserOnlineStatus)
router.get("/online-all",ExpertsController.getAllOnlineStatus)
module.exports = router
