require('dotenv').config()
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const validator = require("node-email-validation");
const { v4: uuidv4 } = require("uuid");
const _ = require("lodash");
const path = require("path");
const userVerification = require("../models/userVerification");
const config = process.env;
const sendGridTransport = require("nodemailer-sendgrid-transport");

const { setUserInfo } = require("../helpers");
const { sendRegistrationEmail } = require("../helpers");
const { getRole } = require("../helpers");
const User = require("../models/user");
const Otp = require("../models/otp");
const Code = require("../models/regCode");
const Experts = require("../models/experts");
const { sendForgotPasswordEmail } = require('./emailNotificationsController');

exports.emailValidate = (req, res) => {
  let { email } = req.body;
  // Check for email
  if (!email) {
    return res.json({ error: "Email is Required " });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        return res.json({
          status: "FAILED",
          error: "This email address is already in use",
        });
      } else if (!validator.is_email_valid(email)) {
        return res.json({
          status: "FAILED",
          error: "Please input a valid email address",
        });
      } else {
        return res.json({
          status: "PASSED",
          message: "Ok",
        });
      }
    })
    .catch((error) => {
      console.log(error);
      return res.json({
        status: "FAILED",
        message: error,
      });
    });
};

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: config.SENDGRID_API,
    },
  })
);

//= =======================================
// Send verification Email
//= ======================================

const sendVerificationEmail2 = (otp, email, res) => {
  const mailOptions = {
    from: `what i do <no-reply@whatido.app>`,
    to: email,
    subject: `Verify Your Email`,
    html: `  <p><strong>${otp}</strong> is your One Time Passcode, verify your email address to complete the signup and login into your
     account.
   </p>
   <b>
     This <b>expires in 5 minutes</b>`,
  };
  transporter
    .sendMail(mailOptions)
    .then(() => {
      return res.json({
        success: true,
        status: "PENDING",
        message: "verification email sent",
      });
    })
    .catch((error) => {
      console.log(error);
      return res.json({
        status: "FAILED",
        message: "verification email failed",
      });
    });
};
const sendOTpEmail = (otp, email, res) => {
  const mailOptions = {
    from: `what i do <no-reply@whatido.app>`,
    to: email,
    subject: `Reset your password`,
    html: `
    <div>  <p><strong>${otp}</strong> is your One Time Passcode, 
   </p>
   <div>
     This <b>expires in 5 minutes</b>
     <br>
     <p>Do not disclose to anyone</p>
     <p>You are receiving this because you (or someone else) have requested the reset of the password for your account<p>

  <p>If you did not request this, please ignore this email and your password will remain unchanged.</p>
  </div>
  </div>
     `,
  };
  transporter
    .sendMail(mailOptions)
    .then(() => {
      return res.json({
        success: true,
        status: "PENDING",
        message: "otp sent",
      });
    })
    .catch((error) => {
      console.log(error);
      return res.json({
        status: "FAILED",
        message: "otp failed",
      });
    });
};

//= =======================================
// Send verification Phone Number
//= ======================================

const sendVerificationPhoneNumber = (otp, number, res) => {
  const twilioAccountSID = config.twilioAccountSID;
  const twilioauthToken = config.twilioauthToken;
  const twilioFromNumber = config.twilioFromNumber;
  const messageBody = `${otp} is your One Time Passcode, verify your email address to complete the signup and login into your account.
  This expires in 30 Seconds`;
  const client = require("twilio")(twilioAccountSID, twilioauthToken);

  client.messages
    .create({
      to: number,
      from: twilioFromNumber,
      body: messageBody,
    })
    .then(() => {
      return res.json({
        status: true,
        status: "PENDING",
        message: "message has been sent",
      });
    })
    .catch((error) => {
      console.log(error);
      return res.json({
        status: "FAILED",
        message: "verification failed to send",
      });
    });
};

//= =======================================
// Send verification Email
//= =======================================

const sendVerificationEmail = ({ _id, email }, res) => {
  const uniqueString = uuidv4() + _id;
  const mailOptions = {
    from: `whatido <no-reply@whatido.app`,
    to: email,
    subject: `Verify Your Email`,
    html: `  <p>
     verify your email adress to complete the signup and login into your
     account.
   </p>
   <p>
     This link <b>expires in 6 hours</b>
   </p> <p>Press <a href=${config.api_url + "/auth/verify/" + _id + "/" + uniqueString
      }> here </p>`,
  };

  bcrypt.genSalt(10, (err, salt) => {
    if (err) {
      console.log(error);
      return res.json({
        status: "FAILED",
        message: "An error occurred while salting email",
      });
    }

    bcrypt.hash(uniqueString, salt, async (err1, hashedString) => {
      if (err1) {
        console.log(error);
        return res.json({
          status: "FAILED",
          message: "An error occurred while hashing email",
        });
      }
      // set value in userVerification collection
      const newVerification = new userVerification({
        userId: _id,
        uniqueString: hashedString,
        expiresAt: Date.now() + 21600000,
      });
      newVerification
        .save()
        .then(() => {
          transporter
            .sendMail(mailOptions)
            .then(() => {
              return res.json({
                success: true,
                status: "PENDING",
                message: "verification email sent",
              });
            })
            .catch((error) => {
              console.log(error);
              return res.json({
                status: "FAILED",
                message: "verification email failed",
              });
            });
        })
        .catch((error) => {
          console.log(error);
          return res.json({
            status: "FAILED",
            message: "could not save verifiaction record",
          });
        });
    });
  });
};

//= =======================================
// verfiy user  Routes
//= =======================================

exports.verfyEmail = (req, res) => {
  let { userId, uniqueString } = req.params;
  userVerification
    .find()
    .then((result) => {
      if (result.length > 0) {
        const { expiresAt } = result[0];
        const hasedUniqueSring = result[0].uniqueString;
        if (expiresAt < Date.now()) {
          userVerification
            .deleteOne({ userId })
            .then(() => {
              User.deleteOne({ _id: userId })
                .then(() => {
                  let message = "Link has expired. Please signup again";
                  res.redirect(`/auth/verified/?error=true&message=${message}`);
                })
                .catch((error) => {
                  console.log(error);
                  let message = "clearing user with epired unique sting failed";
                  res.redirect(`/auth/verified/?error=true&message=${message}`);
                });
            })
            .catch((error) => {
              console.log(error);
              let message =
                "An error occures while while deleting the expired user  verification record";
              res.redirect(`/auth/verified/?error=true&message=${message}`);
            });
        } else {
          // vaild verication record
          // compare the hashed value

          bcrypt.compare(uniqueString, hasedUniqueSring, (err, result) => {
            if (err) {
              console.log(err);
              let message =
                "An error occures while compairing the unique string";
              res.redirect(`/auth/verified/?error=true&message=${message}`);
            }
            if (result) {
              //string match
              User.updateOne({ _id: userId }, { verified: true })
                .then(() => {
                  userVerification
                    .deleteOne({ userId })
                    .then(() => {
                      res.sendFile(
                        path.join(__dirname, "./../views/verified.html")
                      );
                    })
                    .catch((error) => {
                      console.log(error);
                      let message =
                        "An error occures while finalizing successful verification";
                      res.redirect(
                        `/auth/verified/?error=true&message=${message}`
                      );
                    });
                })
                .catch((error) => {
                  console.log(error);
                  let message =
                    "An error occures while updating user record to show verified";
                  res.redirect(`/auth/verified/?error=true&message=${message}`);
                });
            } else {
              //string don't match
              let message =
                "Invalid verification details passed. Check your inbox";
              res.redirect(`/auth/verified/?error=true&message=${message}`);
            }
          });
        }
      } else {
        let message =
          "Account record does not exist or has been verified already. Please sign up or login";
        res.redirect(`/auth/verified/?error=true&message=${message}`);
      }
    })
    .catch((error) => {
      console.log(error);
      let message =
        "An error occures while checking for existing user verification record";
      res.redirect(`/auth/verified/?error=true&message=${message}`);
    });
};

//= =======================================
// Handel verification  message
//= =======================================

exports.verfied = (req, res) => {
  res.sendFile(path.join(__dirname, "./../views/verified.html"));
};
//= =======================================
// Signup Expert Send Signup Link Route
//= =======================================
exports.signupExpertSendSignupLink = function (req, res, next) {
  console.log(req.body);
  // Check for registration errors
  const { email } = req.body;
  const { expertemail } = req.body;
  // let emailtest1=new RegExp("@stanford.edu").test(email);
  // let emailtest2=new RegExp("@harvard.edu").test(email);
  // Return error if no email provided
  if (!email) {
    return res.json({
      error: "You must enter an email address.",
      email,
      expertemail,
    });
  }

  // if(!(emailtest1 || emailtest2)){
  //   return res.status(422).send({ error: 'Email Should start with @stanford.edu  or @harvard.edu' });
  // }

  // else if( !/.+@stanford\.edu/.test(email) || !/.+@harvard\.edu/.test(email) ){
  //   return res.json({error: 'Email should be of @stanford.edu OR @harvard.edu', email: email, expertemail: expertemail });
  // }

  User.findOne({ email }, (err, existingUser) => {
    if (err) {
      return next(err);
    }
    let resetToken = "";
    if (existingUser) {
      return res.json({
        error: "This email address is already in use.",
        email,
        expertemail,
      });
    }
    const buf = crypto.randomBytes(48);
    resetToken = buf.toString("hex");
    ExpertSignupToken.findOne({ email }, (err2, existingUserSignupToken) => {
      if (err2) {
        console.error(err2);
        return res.status(500);
      }
      if (existingUserSignupToken) {
        // sendExpertSignupTokenEmail(existingUserSignupToken);
        return res.json({
          message: "Success: Email with signup link is sent to you!",
        });
      }
      // case new account
      const expertSignupToken = new ExpertSignupToken({
        email,
        token: resetToken,
        tokenExpires: Date.now() + 3600000, // 1 hour
      });
      expertSignupToken.save((err1, user) => {
        if (err1) {
          return next(err1);
        }
        if (user) {
          sendExpertSignupTokenEmail(user);
        }
        return res.json({
          message:
            "Congrats! We have sent you link on your email. Please check your email.",
        });
      });
    });
  });
};

// Generate JWT
// TO-DO Add issuer and audience
function generateToken(user) {
  return jwt.sign(user, config.secret, {
    expiresIn: 604800, // in seconds
  });
}

//= =======================================
// Login Route
//= =======================================

exports.login = (req, res) => {
  console.log("hell---");
  // if (req.user.data?.verified === false) {
  //   return res.json({
  //     errorMessage:
  //       'Your account has not be verified check your email for verification link.',
  //   })
  // }
  if (req.user.data?.status === false) {
    return res.json({ errorMessage: "Sorry You've Been Banned" });
  }
  if (req.user) {
    res.setHeader("Access-Control-Allow-Credentials", "true");
    const userInfo = setUserInfo(req.user.data);
    return res.status(200).json({
      token: `JWT ${generateToken(userInfo)}`,
      user: userInfo,
    });
  }
  return res.sendStatus(404);
};

//= =======================================
// Logout Route
//= =======================================
exports.logout = (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return res
      .status(401)
      .json({ error: "You are not authorized to view this user profile." });
  }
  User.findById(userId)
    .then((user) => {
      user.onlineStatus = "OFFLINE";
      user.save();
      return res.status(200).json({});
    })
    .catch((err) => {
      res.status(400).json({ error: "No user could be found for this ID." });
      return next(err);
    });
};

//= =======================================
// Facebook Route
//= =======================================
exports.facebookSendJWTtoken = (req, res) => {
  if (req.body.token) {
    User.findOne({ jwtLoginAccessToken: req.body.token })
      .then((userInfo) => {
        if (userInfo) {
          setUserInfo(userInfo);
          return res.status(200).json({
            token: userInfo.jwtLoginAccessToken,
            user: userInfo,
          });
        }
        return res.status(200).json({
          token: "",
          user: "",
        });
      })
      .catch(() => res.status(500));
  } else {
    return res.status(200).json({
      token: "",
      user: "",
    });
  }
};

//= =======================================
// Twitter Route
//= =======================================
exports.twitterSendJWTtoken = (req, res) => {
  if (req.body.token) {
    User.findOne({ jwtLoginAccessToken: req.body.token })
      .then((userInfo) => {
        if (userInfo) {
          setUserInfo(userInfo);
          res.status(200).json({
            token: userInfo.jwtLoginAccessToken,
            user: userInfo,
          });
        } else {
          res.status(200).json({
            token: "",
            user: "",
          });
        }
      })
      .catch(() => res.status(500));
  } else {
    res.status(200).json({
      token: "",
      user: "",
    });
  }
};

//= =======================================
// Finsih Registration Route
//= =======================================

exports.finishSignUp = async (req, res, next) => {
  const { firstName } = req.body;
  const { lastName } = req.body;
  const { password } = req.body;
  const { expertise } = req.body;
  const { email } = req.body;

  const role = "Expert";

  const expertSubCategories = "new_category";

  // Return error if no email provided
  if (!email) {
    return res.json({ error: "You must enter an email address." });
  }

  // Return error if no password provided
  if (!password) {
    return res.json({ error: "You must enter a password." });
  }

  // Return error if no expertise provided
  if (!expertise) {
    return res.json({ error: "You must enter a expertise." });
  }

  // Mail checking

  if (!validator.is_email_valid(email)) {
    return res.json({ err: "Please input valid mail address" });
  }
  let user_obj;

  try {
    user_obj = await User.findOne({ email: email });
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }

  if (user_obj) {
    let updateduser = {
      email: email,
      password: password,
      profile: { firstName, lastName },
      expertSubCategories: expertSubCategories,
      role: role,
      expertCategories: expertise,
    };

    bcrypt.genSalt(5, (err, salt) => {
      if (err) return next(err);
      bcrypt.hash(updateduser.password, salt, async (err1, hash) => {
        if (err1) return next(err1);
        updateduser.password = hash;

        updateduser.onlineStatus = "ONLINE";
        try {
          let savedUser = await User.findOneAndUpdate(
            { _id: user_obj._id },
            updateduser,
            { new: true }
          );

          if (savedUser) {
            sendRegistrationEmail(updateduser);
            const userInfo = setUserInfo(savedUser);
            console.log("[SUCCESS]:[USER_REGISTER_SUCCESS");
            return res.json({
              success: true,
              token: `JWT ${generateToken(userInfo)}`,
              user: userInfo,
            });
          }
        } catch (error) {
          console.log(error);
          return res.status(400).json({
            error: true,
            error: error,
          });
        }
      });
    });
  }
};

//= =======================================
// SEND OTP PHONE NUMBER
//= =======================================
exports.OtpSendPhone = (req, res, next) => {
  const { email, number } = req.body;

  // Check for email
  if (!email) {
    return res.json({ error: "Email is Required " });
  }

  User.findOne({ email: email })
    .then((user) => {
      if (user) {
        return res.json({
          status: "FAILED",
          error: "This email address is already in use",
        });
      } else if (!validator.is_email_valid(email)) {
        console.log(email);
        return res.json({
          status: "FAILED",
          error: "Please input a valid email address",
        });
      } else {
        // Generate OTP

        const OTP = otpGenerator.generate(4, {
          digits: true,
          lowerCaseAlphabets: false,
          upperCaseAlphabets: false,
          specialChars: false,
        });

        //save OTP
        const otp = new Otp({ email: email, otp: OTP });
        bcrypt.genSalt(5, async (err, salt) => {
          if (err) return next(err);
          bcrypt.hash(otp.otp, salt, (err1, hash) => {
            if (err1) return next(err1);
            otp.otp = hash;
          });
          const result = await otp.save();
          sendVerificationPhoneNumber(OTP, number, res);
        });
      }
    })
    .catch((error) => {
      console.log(error);
      return res.json({
        status: "FAILED",
        message: error,
      });
    });
};

//= =======================================
//SEND OTP EMAIL
//= =======================================
exports.OtpSend = async (req, res, next) => {
  try{
    const { email } = req.body;

    // Check for email
    if (!email) {
      return res.json({ error: "Email is Required " });
    }
  
    User.findOne({ email: email })
      .then(async (user) => {
        if (user) {
          return res.json({
            status: "FAILED",
            error: "This email address is already in use",
          });
        } else {
          // Generate OTP
  
          const OTP = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
          });
  
          //save OTP
          const otp = new Otp({ email: email, otp: OTP });
          const salt = await bcrypt.genSalt(5);
          const hashOtp = await bcrypt.hash(otp.otp, salt);
          otp.otp = hashOtp;
          await otp.save();
          sendVerificationEmail2(OTP, email, res);
        }
      })
      .catch((error) => {
        console.log(error);
        return res.json({
          status: "FAILED",
          message: error,
        });
      });
  }
  catch(error){
    console.log(error)
    res.status(500).json(error)
  }
};

//= =======================================
// Validate Otp
//= =======================================
exports.OtpValidate = async (req, res, next) => {
  const { email, otp } = req.body;
  // Return error if no OTP provided
  if (!otp) {
    return res.json({
      error: "OTP required",
      success: false,
    });
  }

  const otpHolder = await Otp.find({
    email: email,
  });
  if (otpHolder.length === 0) {
    return res.json({
      error: "you used an Expired OTP",
      success: false,
    });
  }
  const rightOtpFind = otpHolder[otpHolder.length - 1];

  //compare the OPT provided with the one in the DB
  bcrypt.compare(otp, rightOtpFind.otp, (err, validUser) => {
    if (err) {
      console.log(err);
      res.json({
        error: "An error occures while compairing the unique string.",
        success: false,
      });
    }

    // check if user email and user is Valid
    if (rightOtpFind.email === email && validUser) {
      User.findOne({ email })
        .then(async (existingUser) => {
          if (existingUser) {
            return res.json({
              error: "That email address is already in use.",
              success: false,
            });
          }

          // Generate OTP

          const CODE = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
          });

          //save OTP
          const code = new Code({ email: email, code: CODE });
          bcrypt.genSalt(5, async (err, salt) => {
            if (err){
              return res.status(200).json({
                message: "OTP validation failed",
                success: false
              });
            } 
            bcrypt.hash(code.code, salt, async (err1, hash) => {
              if (err1){
                return res.status(200).json({
                  message: "OTP validation failed",
                  success: false
                });
              } 
              code.code = hash;
              await code.save();
              res.status(200).json({
                message: "OTP Validated",
                success: true,
                code: CODE,
              });
            });
          
          });
        })
        .catch((err) => {
          console.log(err);
          return res.json({ error: "Error in finding user." });
        });
    } else {
      console.log("[FAILED]:[OTP_VALIDATION_FAILED");
      return res.json({
        error: "your code was wrong !",
        success: false,
      });
    }
  });
};

//= =======================================
// Validate Otp
//= =======================================

exports.register2 = async (req, res, next) => {
  // Check for registration errors

  const { email, code, firstName, lastName, password, experties, community } =
    req.body;
  // Return error if no firstName provided
  if (!firstName) {
    return res.json({ error: "You must enter a firstName." });
  }

  // Return error if no firstName provided
  if (!lastName) {
    return res.json({ error: "You must enter a lastName" });
  }
  const slugId = uuidv4();
  const slug = `${firstName}-${lastName}-${slugId}`;

  // const confrimExpertMainCategory = await Experts.findOne({ slug: community });
  // if (!confrimExpertMainCategory) {
  //   return "expert main category not found"
  // }
  // Return error if no email provided
  if (!email) {
    return res.json({ error: "You must enter an email address." });
  }

  // Return error if no Code provided
  if (!code) {
    return res.json({ error: "registration Code required" });
  }

  // Return error if no password provided
  if (!password) {
    return res.json({ error: "You must enter a password." });
  }

  const codeHolder = await Code.find({
    email: email,
  });
  if (codeHolder.length === 0) {
    return res.json({
      error: "you used an expired code",
      success: false,
    });
  }
  const rightCodeFind = codeHolder[codeHolder.length - 1];

  //compare the OPT provided with the one in the DB
  bcrypt.compare(code, rightCodeFind.code)
  .then((validUser) => {

    // check if user email and user is Valid
    if (rightCodeFind.email === email && validUser) {
      User.findOne({ email })
        .then(async (existingUser) => {
          if (existingUser) {
            console.log("[ERROR]:[NEW USER USED ALREADY EXISTING EMAIL]");
            return res.json({
              error: "This email address is already in use.",
              success: false,
            });
          };
          const SALT_FACTOR = 5;
          const salt = await bcrypt.genSalt(SALT_FACTOR);
          const hash = await bcrypt.hash(password, salt);
          const user = new User({
            email:email,
            password:hash,
            profile: { firstName, lastName },
            slug:slug,
            slugId:slugId,
            experties: experties,
            community: community,
            verified: true,
              })
          user.save((err, users) => {
            if (err){
              console.log(err)
              return res.json({
                error: "User failed to save here.",
                success: false,
              });
            }
            else{
                return res.json({
                error: false,
                success: "account successfuly created",
                data: users
              });
            }
          })
            })
      .catch((err) => {
                console.log(err);
                return res.json({
                  error: "User failed to save .",
                  success: false,
                });
              });
          }
      else {
            return res.status(400).json({
              message: "Your Code was Wrong !",
              success: false,
            });
        }

    }) 
.catch((err)=>{
    res.json({
      error: "An error occures while comparing the unique Code string.",
      success: false,
    });
  
})}
//= =======================================
// Forgot Password Route
//= =======================================

// change password

exports.forgotPasswordOtpSend = async (req, res, next) => {
  try{
    const { email } = req.body;

    // Check for email
    if (!email) {
      return res.json({ error: "Email is Required " });
    }
  
    User.findOne({ email: email })
      .then(async (user) => {
        if (!user) {
          return res.json({
            status: "FAILED",
            error: "No account associated with this email address",
          });
        } else {
          // Generate OTP
  
          const OTP = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
          });
  
          //save OTP
          const otp = new Otp({ email: email, otp: OTP });
          const salt = await bcrypt.genSalt(5);
          const hashOtp = await bcrypt.hash(otp.otp, salt);
          otp.otp = hashOtp;
          await otp.save();
          await sendForgotPasswordEmail(OTP, email, res);
        }
      })
      .catch((error) => {
        console.log(error);
        return res.json({
          status: "FAILED",
          message: error,
        });
      });
  }
  catch(error){
    console.log(error)
    res.status(500).json(error)
  }
};

//= =======================================
// Validate Otp
//= =======================================
exports.forgotPasswordOtpValidate = async (req, res, next) => {
  const { email, otp } = req.body;
  // Return error if no OTP provided
  if (!otp) {
    return res.json({
      error: "OTP required",
      success: false,
    });
  }

  const otpHolder = await Otp.find({
    email: email,
  });
  if (otpHolder.length === 0) {
    return res.json({
      error: "you used an Expired OTP",
      success: false,
    });
  }
  const rightOtpFind = otpHolder[otpHolder.length - 1];

  //compare the OPT provided with the one in the DB
  bcrypt.compare(otp, rightOtpFind.otp, (err, validUser) => {
    if (err) {
      console.log(err);
      res.json({
        error: "An error occures while compairing the unique string.",
        success: false,
      });
    }

    // check if user email and user is Valid
    if (rightOtpFind.email === email && validUser) {
      User.findOne({ email })
        .then(async (existingUser) => {
          if (!existingUser) {
            return res.json({
              error: "No account associated with this email address",
              success: false,
            });
          }

          // Generate OTP

          const CODE = otpGenerator.generate(4, {
            digits: true,
            lowerCaseAlphabets: false,
            upperCaseAlphabets: false,
            specialChars: false,
          });

          //save OTP
          const code = new Code({ email: email, code: CODE });
          bcrypt.genSalt(5, async (err, salt) => {
            if (err){
              return res.status(200).json({
                message: "OTP validation failed",
                success: false
              });
            } 
            bcrypt.hash(code.code, salt, async (err1, hash) => {
              if (err1){
                return res.status(200).json({
                  message: "OTP validation failed",
                  success: false
                });
              } 
              code.code = hash;
              await code.save();
              res.status(200).json({
                message: "OTP Validated",
                success: true,
                code: CODE,
              });
            });
          
          });
        })
        .catch((err) => {
          console.log(err);
          return res.json({ error: "Error in finding user." });
        });
    } else {
      console.log("[FAILED]:[OTP_VALIDATION_FAILED");
      return res.json({
        error: "your code was wrong !",
        success: false,
      });
    }
  });
};

exports.savePassword = async (req, res, next) => {
  // Check for registration errors

  const { email, code, password } =
    req.body;
  // Return error if no firstName provided

  if (!email) {
    return res.json({ error: "You must enter an email address." });
  }

  // Return error if no Code provided
  if (!code) {
    return res.json({ error: "registration Code required" });
  }

  // Return error if no password provided
  if (!password) {
    return res.json({ error: "You must enter a password." });
  }

  const codeHolder = await Code.find({
    email: email,
  });
  if (codeHolder.length === 0) {
    return res.json({
      error: "you used an expired code",
      success: false,
    });
  }
  const rightCodeFind = codeHolder[codeHolder.length - 1];

  //compare the OPT provided with the one in the DB
  bcrypt.compare(code, rightCodeFind.code)
  .then((validUser) => {

    // check if user email and user is Valid
    if (rightCodeFind.email === email && validUser) {
      User.findOne({ email })
        .then(async (existingUser) => {
          if (!existingUser) {
            return res.json({
              error: "No account associated with this email address",
              success: false,
            });
          };
          const SALT_FACTOR = 5;
          const salt = await bcrypt.genSalt(SALT_FACTOR);
          const hash = await bcrypt.hash(password, salt);
          existingUser.password = hash
          existingUser.save((err, users) => {
            if (err){
              console.log(err)
              return res.json({
                error: "Change of password not successful",
                success: false,
              });
            }
            else{
                return res.json({
                error: false,
                success: "Successfully changed your password "
              });
            }
          })
            })
      .catch((err) => {
                console.log(err);
                return res.json({
                  error: "Change of password not successful",
                  success: false,
                });
              });
          }
      else {
            return res.status(400).json({
              message: "Your Code was Wrong !",
              success: false,
            });
        }

    }) 
.catch((err)=>{
    res.json({
      error: "An error occures while comparing the unique Code string.",
      success: false,
    });
  
})}