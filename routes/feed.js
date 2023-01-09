const express = require("express");
const FeedController = require('../controllers/feed')
const router = express.Router()
const feedRoutes = express.Router()
router.use("/feed", feedRoutes);
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });

// Feed Routes
//= ========================
// get recent-messaged-users
feedRoutes.get("/recent-messaged-users/:slug",requireAuth,FeedController.getTenPeers);
// get community feeds
feedRoutes.get("/community/:community", FeedController.getCommunity);
// get for you page feeds
feedRoutes.get("/for-you/:slug",requireAuth, FeedController.getForYou);
// get inspiring page feeds
feedRoutes.get("/inspiring", FeedController.getInspiring);
// get for you page feeds for none auth users
feedRoutes.get("/for-you", FeedController.getNoneUserForYou);
// get discover page feeds
feedRoutes.get("/discover", FeedController.getDiscover);
feedRoutes.get("/discover-expert", FeedController.getExpertDiscover);
feedRoutes.get("/discover-expert-community/:community", FeedController.getExpertCommunityDiscover);
feedRoutes.get("/discover-banner/", FeedController.getDiscoverBanner);
feedRoutes.get("/total/:community", FeedController.getTotalPostandUsers)
module.exports = router
