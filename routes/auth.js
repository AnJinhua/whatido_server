require('dotenv').config()
const express = require("express");
const AuthenticationController = require('../controllers/authentication')
const { encryptQueryParams } = require("query-string-hash");

const MainSettings = process.env;
const passport = require("passport");
const requireAuth = passport.authenticate("jwt", { session: false });
const requireLogin = passport.authenticate("local", {
  // failureRedirect: '/login/failed',
});
const router = express.Router()
const authRoutes = express.Router()
router.use('/auth', authRoutes)


// Login route
authRoutes.post("/login", requireLogin, AuthenticationController.login);

// Logout route
authRoutes.post("/logout/:userId", AuthenticationController.logout);

// Password reset request route (generate/send token)
// authRoutes.post("/forgot-password", AuthenticationController.forgotPassword);

authRoutes.get("/login/success", (req, res) => {
    if (req.user && req.user?.verified !== false) {
        const userInfo = setUserInfo(req.user);

        res.status(200).json({
            success: true,
            user: userInfo,
            token: req.user.jwtLoginAccessToken,
            //   cookies: req.cookies
        });
    } else {
        res.status(401).json({
            success: false,
            user: req.user,
            message: "failure",
        });
    }
});
//= ========================
// Google Routes
//= ========================

authRoutes.get(
    "/google",
    passport.authenticate("google", {
        scope: ["email", "profile"],
        prompt: "select_account",
    })
);

//= ========================
// Google Routes callback
//= ========================

authRoutes.get(
    "/google/callback",
    passport.authenticate("google", {
        failureMessage: "Cannot login with Google, please try again later!",
        failureRedirect: "/login/failed",
    }),
    (req, res) => {
        if (req.user.status == "LOGIN") {
            res.redirect(MainSettings.website_url);
            res.send("Thank you for signing in!");
        } else {
            const queryParams = req.user.data.code;
            const hash = encryptQueryParams(`code=${queryParams}`);
            res.redirect(
                `${MainSettings.website_url}/register/${req.user.data.email}/?token=${hash}`
            );
        }
    }
);

//= ========================
// Facebook Routes
//= ========================

authRoutes.get(
    "/facebook",
    passport.authenticate("facebook", {
        authType: "reauthenticate",
        scope: "email",
    })
);

//= ========================
// Facebook Routes callback
//= ========================

authRoutes.get(
    "/facebook/callback",
    passport.authenticate(
        "facebook",

        {
            failureMessage: "Cannot login with FaceBook, please try again later!",

            failureRedirect: "/login/failed",
        }
    ),
    (req, res) => {
        if (req.user.status == "LOGIN") {
            res.redirect(MainSettings.website_url);
            res.send("Thank you for signing in!");
        } else {
            const queryParams = req.user.data.code;
            const hash = encryptQueryParams(`code=${queryParams}`);
            res.redirect(
                `${MainSettings.website_url}/register/${req.user.data.email}/?token=${hash}`
            );
        }
    }
);

//= ========================
// Twitter Routes
//= ========================

authRoutes.get("/twitter", passport.authenticate("twitter"));
//= ========================
// Twitter Routes callback
//= ========================
authRoutes.get(
    "/twitter/callback",
    passport.authenticate("twitter", {
        failureMessage: "Cannot login with Twitter, please try again later!",
        failureRedirect: "/login/failed",
    }),
    (req, res) => {
        if (req.user.status == "LOGIN") {
            res.redirect(MainSettings.website_url);
            res.send("Thank you for signing in!");
        } else {
            const queryParams = req.user.data.code;
            const hash = encryptQueryParams(`code=${queryParams}`);
            res.redirect(
                `${MainSettings.website_url}/register/${req.user.data.email}/?token=${hash}`
            );
        }
    }
);


// Registration route
// authRoutes.post("/register", AuthenticationController.register);

// @desc    Finish Registration
// @route   Post /finish-signup'
// @access  Private
authRoutes.post(
    "/finish-signup",
    requireAuth,
    AuthenticationController.finishSignUp
);

// check email not used
// @access Public
authRoutes.post("/emailValidate", AuthenticationController.emailValidate);

// Send  email verifiction
// @access Public
authRoutes.post("/otp", AuthenticationController.OtpSend);

// Send  OTP via phone number
// @access Public
authRoutes.post("/phoneOtp", AuthenticationController.OtpSendPhone);

// validate otp
// @access Public
authRoutes.post("/otpValidate", AuthenticationController.OtpValidate);

// Send register acount with otp
// @access Public
authRoutes.post("/register2", AuthenticationController.register2);

// verified message
// @access Public
authRoutes.get("/verified/", AuthenticationController.verfied);

// Password reset route (change password using token)
authRoutes.post(
    "/reset-password/send",
    AuthenticationController.forgotPasswordOtpSend
);
authRoutes.post("/reset-password/verify", AuthenticationController.forgotPasswordOtpValidate);
// Signup link for expert
authRoutes.post("/reset-password/save", AuthenticationController.savePassword);
// Signup link for expert
authRoutes.post(
    "/signupExpertSendSignupLink",
    AuthenticationController.signupExpertSendSignupLink
);

module.exports = router
