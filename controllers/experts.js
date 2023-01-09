/* eslint-disable global-require */
require('dotenv').config()
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const fs = require("fs");
const config = process.env;
const OpenTok = require("../lib_opentok/opentok");

const { setUserInfo } = require("../helpers");
const { sendExpertSignupSuccessEmail } = require("../helpers");
const { deleteExpertSignupToken } = require("../helpers");

const Experts = require("../models/experts");
const ExpertStory = require("../models/expertstory");
const User = require("../models/user");
const UserReview = require("../models/userreview");
const ExpertSignupToken = require("../models/expertsignuptoken");
const Media = require("../models/media");
const path = require("path");
const opentok = new OpenTok(config.opentok_apiKey, config.opentok_apiSecret);
const hbs = require("nodemailer-express-handlebars");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { MEDIA_CDN_URL } = require("../config/s3");
const { isNull } = require('util');
const { deleteFile } = require('./uploaderController');
const userStatus = require('../models/userStatus');
const conversation = require('../models/conversation');

const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("./views/email-templates/notifications/"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./views/email-templates/notifications/"),
};

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: config.SENDGRID_API,
    },
  })
);

transporter.use("compile", hbs(handlebarOptions));

function allTitleCase(inStr) {
  return inStr.replace(
    /\w\S*/g,
    (tStr) => tStr.charAt(0).toUpperCase() + tStr.substr(1).toLowerCase()
  );
}

//= =======================================
// Experts Routes
//= =======================================
function getExpertCount(slug) {
  return new Promise((resolve, reject) => {
    User.find(
      {
        expertCategories: [slug],
      },
      (err, results) => {
        if (err) reject(err);
        else resolve(results.length);
      }
    );
  });
}

function CategoriesWithExpertsCounts(categories) {
  const newCategories = [];
  setTimeout(() => {
    categories.forEach(async (category) => {
      const newCat = {};
      newCat._id = category._id;
      newCat.name = category.name;
      newCat.slug = category.slug;
      const newSubCats = [];
      await category.subcategories.forEach(async (subcategory) => {
        const newsubCat = {};
        newsubCat.name = subcategory.name;
        newsubCat.slug = subcategory.slug;
        newsubCat.expertsCount = await getExpertCount(subcategory.slug);
        newSubCats.push(newsubCat);
      });
      newCat.subcategories = newSubCats;
      newCategories.push(newCat);
    });
    // return newCategories;
  }, 2000);
  return newCategories;
}

/* API endpoint to render all categories list on homepage */
exports.getExpertsCategoryList = function (req, res) {
  Experts.aggregate(
    [
      {
        $project: {
          subcategory: 1,
          name: 1,
          slug: 1,
          order: 1,
          entity_id: { $literal: 54 },
        },
      },

      { $unwind: "$subcategory" },

      {
        $group: {
          _id: "$_id",
          name: {
            $first: "$name",
          },
          slug: {
            $first: "$slug",
          },
          subcategories: {
            $push: "$subcategory",
          },
        },
      },

      { $sort: { order: 1, name: 1 } },
    ],
    (err, users) => {
      if (err) {
        return res.status(200).json(err);
      }

      return res.status(200).json(users);
    }
  );
};

/* API endpoint to render all experts list by keyword */
exports.getExpertsListingByKeyword = async function (req, res, next) {
  if (!req.params.keyword) {
    res.status(422).send({ error: "Please choose any keyword" });
    return next();
  }
  let { keyword } = req.params;
  if (keyword.length === 0) return res.json([]);
  keyword = keyword.replace(/^&+/i, "");
  res.header("Access-Control-Allow-Origin", "*");
  let search;

  try {
    search = await User.aggregate([
      {
        $match: {
          $or: [
            { expertCategories: { $regex: new RegExp(keyword, "i") } },
            { expertFocusExpertise: { $regex: new RegExp(keyword, "i") } },
            { locationCountry: { $regex: new RegExp(keyword, "i") } },
            { locationState: { $regex: new RegExp(keyword, "i") } },
            { locationCity: { $regex: new RegExp(keyword, "i") } },
            { "profile.firstName": { $regex: new RegExp(keyword, "i") } },
            { "profile.lastName": { $regex: new RegExp(keyword, "i") } },
          ],
          role: "Expert",
        },
      },
      {
        $project: {
          accountCreationDate: 0,
          createdAt: 0,
          enableAccount: 0,
          email: 0,
          contact: 0,
          // 'onlineStatus':0,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $addFields: {
          onlineStatus: {
            $cond: {
              if: {
                $eq: ["$onlineStatus", "ONLINE"],
              },
              then: true,
              else: false,
            },
          },
        },
      },
    ]);
    if (search) {
      return res.json(search);
    } else {
      return res.json({
        success: false,
        data: {},
        code: 404,
      });
    }
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
};

/* API endpoint to render all experts list by category */
exports.getExpertsListing = function (req, res, next) {
  if (!req.params.category) {
    res.status(422).send({
      error: "Please choose any category",
    });
    return next();
  }

  const { category } = req.params;

  res.header("Access-Control-Allow-Origin", "*");
  User.find(
    {
      expertCategories: {
        $regex: new RegExp(category, "i"),
      },
      role: "Expert",
    },
    {
      accountCreationDate: 0,
      createdAt: 0,
      enableAccount: 0,
      // locationCity :0,
      // locationCountry : 0,
      // locationState : 0,
      locationZipcode: 0,
      password: 0,
      websiteURL: 0,
    }
  )
    .sort({
      createdAt: -1,
    })
    .exec((err, expertsList) => {
      if (expertsList) {
        res.json(expertsList);
      } else {
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    });
};


exports.getTopExpertsListing = function (req, res, next) {
  if (!req.params.category) {
    res.status(422).send({
      error: "Please choose any category",
    });
    return next();
  }

  const { category } = req.params;

  res.header("Access-Control-Allow-Origin", "*");
  User.find(
    {
      expertCategories: {
        $regex: new RegExp(category, "i"),
      },
      role: "Expert",
      expertRating: ["5", "4"],
    },
    {
      accountCreationDate: 0,
      createdAt: 0,
      enableAccount: 0,
      // locationCity :0,
      // locationCountry : 0,
      // locationState : 0,
      locationZipcode: 0,
      password: 0,
      websiteURL: 0,
    }
  )
    .sort({
      expertRating: -1,
    })
    .exec((err, expertsList) => {
      if (expertsList) {
        res.json(expertsList);
      } else {
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    });
};

//send email notification to user
exports.sendEmailMessageToExpert = async (req, res) => {
  const {
    senderName,
    recieverEmail,
    message,
    senderPhoto,
    recieverPhoto,
    senderDesc,
    recieverName,
    url,
    baseUrl,
  } = req.body;
  const mailOptions = {
    from: `${senderName} via what i do <no-reply@whatido.app>`,
    to: recieverEmail,
    subject: `${senderName}, sent you a direct mail`,
    template: "email",
    context: {
      senderName: senderName,
      senderPhoto: senderPhoto,
      senderDesc: senderDesc,
      recieverName: recieverName,
      recieverPhoto: recieverPhoto,
      message: message,
      url: url,
      baseUrl: baseUrl,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`Direct mail sent to ${recieverEmail}`);
      res.status(200).json(info);
    }
  });
};

/* API endpoint to send text message to expert */
exports.sendTextMessageToExpert = function (req, res) {
  // console.log("*****************************************");
  if (
    req.body.text_message !== "" &&
    req.body.text_message !== undefined &&
    req.body.text_expert_email !== "" &&
    req.body.text_expert_email !== undefined
  ) {
    const bodyMessage = req.body.text_message;
    const expertEmail = req.body.text_expert_email;
    const twilioAccountSID = "AC498497309e749bdb201a20c3d1e0c1f9";
    const twilioauthToken = "2cd189a265a979a999c0656396e1b8fb";
    const twilioFromNumber = "+14237026040";
    const messageBodyPrefix =
      "Hi, Someone contacted you on www.donnieslist.com. Message : ";

    // console.log('text_expert_email: ' + req.body.text_expert_email);

    User.findOne(
      {
        email: expertEmail,
      },
      (err, user) => {
        if (!err && user !== "") {
          const client = require("twilio")(twilioAccountSID, twilioauthToken);
          client.messages.create(
            {
              // to: user.contact,
              to: user.expertContactCC + user.contact,
              from: twilioFromNumber,
              body: messageBodyPrefix + bodyMessage,
            },
            (err1, message) => {
              if (!err1 && message.sid) {
                res.status(200).send({
                  message: "Message successfully sent to expert!",
                  messageId: message.sid,
                  error: "",
                });
              } else {
                res.status(200).send({
                  message: "",
                  error: err1,
                });
              }
            }
          );
        } else {
          res.send({
            err,
          });
        }
      }
    );
  } else {
    res.status(422).send({
      error: "parameters empty",
    });
  }
};

/* API endpoint to create expert by admin user */
exports.createExpert = function (req, res, next) {
  const { email } = req.body;
  const firstName =
    req.body.firstName !== "undefined" ? req.body.firstName : "";
  const contact =
    req.body.expertContact !== "undefined" ? req.body.expertContact : "";
  const expertContactCC =
    req.body.expertContactCC !== "undefined" ? req.body.expertContactCC : "";
  const { lastName } = req.body;
  const { password } = req.body;
  let slug = `${req.body.firstName}-${req.body.lastName}`;
  const role = "Expert";
  const { userBio } = req.body;
  const { expertRates } = req.body;
  const university =
    req.body.university !== "undefined" ? req.body.university : "";
  const expertCategories =
    req.body.expertCategories !== "undefined" ? req.body.expertCategories : "";
  const { expertRating } = req.body;
  const expertFocusExpertise =
    req.body.expertFocusExpertise !== "undefined"
      ? req.body.expertFocusExpertise
      : "";
  const yearsexpertise =
    req.body.yearsexpertise !== "undefined" ? req.body.yearsexpertise : "";
  const isMusician = req.body.isMusician && req.body.isMusician;

  const facebookURL = req.body.facebookLink;
  const twitterURL = req.body.twitterLink;
  const instagramURL = req.body.instagramLink;
  const googleURL = req.body.googleLink;
  const linkedinURL = req.body.linkedinLink;
  const snapchatURL = req.body.snapchatLink ? req.body.snapchatLink : "";
  const youtubeURL = req.body.youtubeLink ? req.body.youtubeLink : "";
  const soundcloudURL = req.body.soundcloudLink ? req.body.soundcloudLink : "";
  const { endorsements } = req.body;
  const { myFavorite } = req.body;
  const expertUniversity = req.body.expertUniversity
    ? req.body.expertUniversity
    : "";
  const profileImage = req.files
    ? `/uploads/${Date.now()}-${req.files.profile.name}`
    : "";
  const resume_path = req.files
    ? `/uploads/${Date.now()}-${req.files.resume.name}`
    : "";
  // Return error if no email provided
  const emailtest1 = new RegExp("@stanford.edu").test(email);
  const emailtest2 = new RegExp("@harvard.edu").test(email);

  // if(!(emailtest1 || emailtest2)){
  //   return res.status(422).send({ error: 'Email Should start with @stanford.edu  or @harvard.edu' });
  // }

  if (!firstName || !lastName) {
    return res.json({
      code: 422,
      success: false,
      error: "You must enter your full name.",
    });
  }

  if (!email) {
    return res.json({
      code: 422,
      success: false,
      error: "You must enter an email address.",
    });
  }

  if (req.body.token) {
    if (req.body.token && !(emailtest1 || emailtest2)) {
      return res.json({
        code: 422,
        success: false,
        error: "Email Should start with @stanford.edu  or @harvard.edu",
      });
    }
  }

  // Return error if no password provided

  if (!password) {
    return res.json({
      code: 422,
      success: false,
      error: "You must enter a password.",
    });
  }

  if (req.body.token) {
    if (!profileImage) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter a profile image.",
      });
    }
  }
  if (req.body.token) {
    if (!resume_path) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter a resume.",
      });
    }
  }

  if (req.body.token) {
    if (!expertCategories) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter expert Categories.",
      });
    }
  }
  if (req.body.token) {
    if (!contact) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter expert Contact.",
      });
    }
  }
  if (req.body.token) {
    if (!expertContactCC) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter expert ContactCC.",
      });
    }
  }
  // if(!expertFocusExpertise){
  //     return res.status(422).send({ error: 'You must enter expert Focus Expertise.' });
  // }
  // if(!yearsexpertise){
  //     return res.status(422).send({ error: 'You must enter years expertise.' });
  // }
  // if(!facebookURL){
  //     return res.status(422).send({ error: 'You must enter facebook profile link.' });
  // }
  // if(!linkedinURL){
  //   return res.status(422).send({ error: 'You must enter linkdin profile link.' });
  // }
  // if(!googleURL){
  //   return res.status(422).send({ error: 'You must enter google profile link.' });
  // }
  //
  // if(!twitterURL){
  //   return res.status(422).send({ error: 'You must enter twitter profile link.' });
  // }

  if (req.files && req.files.profile) {
    const file = req.files.profile;
    file.mv(`./public${profileImage}`, (err) => {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("file uploaded");
      }
    });
  }

  if (req.files && req.files.resume) {
    const file = req.files.resume;
    file.mv(`./public${resume_path}`, (err) => {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("file uploaded");
      }
    });
  }

  User.findOne(
    {
      email,
    },
    (err, existingUser) => {
      if (err) {
        return next(err);
      }

      // slug = firstName+'-'+new Date().getUTCMilliseconds();

      // If user is not unique, return error
      if (existingUser) {
        return res.json({
          code: 422,
          success: false,
          error: "That email address is already in use.",
        });
      }

      // audioSessionId
      opentok.createSession((err1, asession) => {
        if (err1) {
          console.log(`error: ${err1}`);
          return res.json({
            err1,
            sessionId: "",
            token: "",
          });
        }

        // archiveSessionId
        opentok.createSession((err2, aRSession) => {
          if (err2) {
            console.log(`error: ${err2}`);
            return res.json({
              err2,
              sessionId: "",
              token: "",
            });
          }
          // videoSessionId
          opentok.createSession((err3, vSession) => {
            if (err3) {
              console.log(`error: ${err3}`);
              return res.json({
                err3,
                sessionId: "",
                token: "",
              });
            }

            const videoSessionId = vSession.sessionId;
            const archiveSessionId = aRSession.sessionId;
            const audioSessionId = asession.sessionId;
            // If email is unique and password was provided, create account
            const user = new User({
              email,
              password,
              contact,
              expertContactCC,
              profile: {
                firstName,
                lastName,
              },
              slug,
              isMusician,
              userBio,
              university,
              profileImage,
              resume_path,
              expertRates,
              expertCategories,
              expertRating,
              expertFocusExpertise,
              yearsexpertise,
              facebookURL,
              twitterURL,
              soundcloudURL,
              googleURL,
              instagramURL,
              linkedinURL,
              youtubeURL,
              snapchatURL,
              role,
              videoSessionId,
              archiveSessionId,
              audioSessionId,
              expertUniversity,
              endorsements,
              myFavorite,
            });

            User.findOne(
              {
                slug,
              },
              (err4, slugfound) => {
                if (err4) {
                  return next(err4);
                }
                if (
                  slugfound &&
                  slugfound !== null &&
                  slugfound !== undefined &&
                  slugfound !== ""
                ) {
                  const t =
                    new Date().getHours().toString() +
                    new Date().getMinutes().toString() +
                    new Date().getSeconds().toString() +
                    new Date().getMilliseconds().toString();
                  // console.log(t)
                  // console.log(slug)
                  slug += t;
                  // console.log(slug)
                  user.slug = slug;

                  user.save((err5, savedUser) => {
                    if (err5) {
                      return next(err5);
                    }
                    sendExpertSignupSuccessEmail(savedUser);
                    deleteExpertSignupToken(savedUser.email);
                    const userInfo = setUserInfo(savedUser);
                    res.status(201).json({
                      success: true,
                      user: {
                        _id: savedUser._id,
                        customerId: "",
                        expertCategories: "",
                        expertFocusExpertise: "",
                        expertRates: "",
                        expertRating: "",
                        facebookURL: "",
                        firstName: savedUser.profile.firstName,
                        lastName: savedUser.profile.lastName,
                        locationCity: "",
                        locationCountry: "",
                        gender: "",
                        profileImage: "",
                        email: savedUser.email,
                        slug: savedUser.slug,
                        role: savedUser.role,
                        userBio: savedUser.userBio,
                        profile: {
                          firstName: savedUser.profile.firstName,
                          lastName: savedUser.profile.lastName,
                        },
                        endorsements: "",
                        myFavorite: "",
                      },
                      message: "Account Created Successfully",
                      token: `JWT ${generateToken(userInfo)}`,
                    });
                  });
                } else {
                  user.save((err6, savedUser) => {
                    if (err6) {
                      return next(err6);
                    }

                    sendExpertSignupSuccessEmail(savedUser);
                    deleteExpertSignupToken(savedUser.email);
                    const userInfo = setUserInfo(savedUser);
                    res.status(201).json({
                      success: true,
                      user: {
                        _id: savedUser._id,
                        customerId: "",
                        expertCategories: "",
                        expertFocusExpertise: "",
                        expertRates: "",
                        expertRating: "",
                        facebookURL: "",
                        firstName: savedUser.profile.firstName,
                        lastName: savedUser.profile.lastName,
                        locationCity: "",
                        locationCountry: "",
                        gender: "",
                        profileImage,
                        resume_path,
                        email: savedUser.email,
                        slug: savedUser.slug,
                        role: savedUser.role,
                        userBio: savedUser.userBio,
                        profile: {
                          firstName: savedUser.profile.firstName,
                          lastName: savedUser.profile.lastName,
                        },
                        endorsements: "",
                        myFavorite: "",
                      },
                      message: "Account Created Successfully",
                      token: `JWT ${generateToken(userInfo)}`,
                    });
                  });
                }
              }
            );
          });
        });
      });
    }
  );
};

exports.deleteExpertProfile = function (req, res, next) {
  const { id } = req.params;
  if (!req.params.id) {
    res.status(422).send({
      error: "Please choose expert slug",
    });
    return next();
  }
  User.findByIdAndDelete({ _id: id }, () => {
    res.status(200).json({
      message: "deleted account ",
      success: true,
    });
  });
};
/* API endpoint to render expert details */
exports.getExpertDetail = function (req, res, next) {
  const { slug } = req.params;
  if (!req.params.slug) {
    res.status(422).send({
      error: "Please choose expert slug",
    });
    return next();
  }
  User.findOne(
    {
      /* 'slug': {
        $regex: new RegExp(slug, "i")
      }, */
      slug: slug,
    },
    {
      accountCreationDate: 0,
      createdAt: 0,
      enableAccount: 0,
      // locationCity :0,
      // locationCountry : 0,
      // locationState : 0,
      locationZipcode: 0,
      password: 0,
    },
    (err, expertsList) => {
      if (err) {
        res.status(404);
        return res.json({
          success: false,
          data: {},
          code: 404,
          err,
        });
      }

      if (expertsList) {
        res.json({
          success: true,
          data: expertsList,
        });
      } else {
        res.status(404);
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    }
  );
};

// get expert details
exports.getExpert = function (req, res, next) {
  const slug = req.params.slug;

  if (!req.params.slug) {
    res.status(422).send({
      error: "Please choose expert slug",
    });
    return next();
  }
  User.findOne(
    {
      slug: slug,
    },
    (err, expertsList) => {
      if (err) {
        res.status(404);
        return res.json({
          success: false,
          data: {},
          code: 404,
          error,
        });
      }
      if (expertsList) {
        var expert = {firstName:expertsList.profile.firstName,
          lastName:expertsList.profile.lastName,
          experties:expertsList.experties,
          community:expertsList.community,
          nationality:expertsList?.nationality,
          imageUrl:expertsList?.imageUrl,
          coverImage:expertsList?.coverImage,
          userBio:expertsList?.userBio,
          email:expertsList.email,
          additionalLinks:expertsList?.additionalLinks,
          locationCity:expertsList?.locationCity,}
        res.json(expert);
      } else {
        res.status(404);
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    }
  );
};
// get expert details

/* API endpoint to add endorsements and my favorite */
exports.addEndorsements = async function (req, res, next) {
  const { toSlug, fromSlug } = req.body;
  if (!toSlug || !fromSlug) {
    res.status(422).send({
      error: "Please choose expert slug",
    });
    return next();
  }
  await User.findOne({ slug: toSlug }, (err, user) => {
    if (err) {
      res.json({ errorMessage: "Sorry Something Went Wrong" });
    } else {
      const { endorsements } = user;
      if (endorsements.indexOf(fromSlug) < 0) {
        endorsements.push(fromSlug);
      }

      user.endorsements = endorsements;
      user.save((err1, savedUser) => {
        if (err1) {
        } else {
        }
      });
    }
  });
  User.findOne({ slug: fromSlug }, (err, user) => {
    if (err) {
      res.json({ errorMessage: "Sorry Something Went Wrong" });
    } else {
      const { myFavorite } = user;

      if (myFavorite.indexOf(toSlug) < 0) {
        myFavorite.push(toSlug);
      }
      user.myFavorite = myFavorite;
      user.save((err1, savedUser) => {
        if (err1) {
          res.json({
            code: 422,
            success: false,
            message: "Something went wrong!",
          });
        } else {
          res.json({
            code: 200,
            success: true,
            message: "Expert added Successfully.",
          });
        }
      });
    }
  });
};
/* API endpoint to get endorsements */

exports.getEndorsements = function (req, res, next) {
  const { slug } = req.query;

  if (!slug) {
    res.status(422).send({
      error: "Please choose expert slug",
    });
    return next();
  }
  User.find(
    {
      slug: {
        $in: slug,
      },
    },
    { profileImage: 1, slug: 1, imageCloudinaryRef: 1, imageUrl: 1 },
    (err, expertsList) => {
      if (expertsList) {
        res.json(expertsList);
      } else {
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    }
  );
};

exports.getMyExpertsListing = function (req, res, next) {
  const { slug, category } = req.body;
  if (!slug) {
    res.status(422).send({
      error: "Please choose expert slug",
    });
    return next();
  }

  User.find(
    {
      expertCategories: {
        $regex: new RegExp(category, "i"),
      },
      role: "Expert",
      slug: {
        $in: slug,
      },
      // 'expertRating' : ['5','4']
    },
    {
      accountCreationDate: 0,
      createdAt: 0,
      enableAccount: 0,
      // locationCity :0,
      // locationCountry : 0,
      // locationState : 0,
      locationZipcode: 0,
      password: 0,
      websiteURL: 0,
    },
    (err, expertsList) => {
      if (expertsList) {
        res.json(expertsList);
      } else {
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    }
  );
};

exports.getExpertStories = function (req, res, next) {
  const { expertEmail } = req.params;
  if (!req.params.expertEmail) {
    res.status(422).send({ error: "Please choose expert Email" });
    return next();
  }
  ExpertStory.find(
    {
      "expert.email": expertEmail,
    },
    {
      "timestamps.updatedAt": 0,
    },
    (err, expertStoryList) => {
      if (expertStoryList) {
        res.json(expertStoryList);
      } else {
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    }
  );
};

exports.saveUserReview = function (req, res) {
  const bind = {};

  const { rating } = req.body;
  const { review } = req.body;
  const { title } = req.body;
  const { expertSlug } = req.body;
  const { userSlug } = req.body;

  const newUserReview = new UserReview();
  newUserReview.rating = rating;
  newUserReview.review = review;
  newUserReview.title = title;
  newUserReview.expertSlug = expertSlug;
  newUserReview.userSlug = userSlug;

  newUserReview.save((error) => {
    if (error) {
      bind.status = 0;
      bind.message = "Oops! error occured while saving user review";
      bind.error = error;
    } else {
      UserReview.find(
        {
          slug: expertSlug        },
        (err, usersreviews) => {
          if (usersreviews) {
            let total = 0;
            for (let x = 0; x < usersreviews.length; x += 1) {
              total += usersreviews[x].rating;
            }
            const average = total / usersreviews.length;
            User.findOne(
              {
                slug: expertSlug,
              },
              (err1, user) => {
                user.expertRating = average;
                user.save();
              }
            );
          } else {
            bind.status = 0;
            bind.message = "Oops! error occured while saving user review";
            bind.error = err;
          }
        }
      );

      bind.status = 1;
      bind.message = "User review was saved successfully";

      /* email for expert */
      let html = `Hello <strong>${allTitleCase(
        expertFullName
      )}</strong>, <br> <strong>${allTitleCase(
        userFullName
      )}</strong> reviewed on your session.`;
      html += "<p>Following is user information:</p>";
      html += `<p>Email : ${userEmail}</p>`;
      html += `<p>Title : ${title}</p>`;
      html += `<p>Review : ${review}</p>`;
      html += `<p>Rating : ${rating}</p>`;

      const mailOptions = {
        from: `${userFullName} via whatido <no-reply@whatido.app>`,
        to: expertEmail,
        subject: "what i do: User Review",
        html,
      };
      transporter.sendMail(mailOptions, (error1, response) => {});
    }
    return res.json(bind);
  });
};

exports.getExpertStoriesBasedOnRole = function (req, res, next) {
  const { expertRole } = req.params;
  if (!req.params.expertRole) {
    res.status(422).send({ error: "Please choose expert Role" });
    return next();
  }
  ExpertStory.aggregate(
    [
      {
        $lookup: {
          from: "users",
          localField: "expert.email",
          foreignField: "email",
          as: "expert_details",
        },
      },
      {
        $match: {
          expert_details: { $ne: [] },
          "expert_details.role": "Expert",
          "expert_details.expertCategories": expertRole,
        },
      },
      {
        $project: {
          "expert_details._id": 0,
          "expert_details.email": 0,
          "expert_details.createdAt": 0,
          "expert_details.updatedAt": 0,
          "expert_details.password": 0,
          "expert_details.accountCreationDate": 0,
          "expert_details.enableAccount": 0,
          "expert_details.contact": 0,
          "expert_details.stripeId": 0,
        },
      },
    ],
    (err, expertStoryList) => {
      if (expertStoryList) {
        res.json(expertStoryList);
      } else {
        res.json({
          success: false,
          data: {},
          code: 404,
        });
      }
    }
  );
};

exports.getExpertReviews = function (req, res, next) {
  const bind = {};
  const { expertSlug } = req.params;
  UserReview.find(
    {
      expertSlug,
      // reviewBy: "User"
    },
    (err, reviews) => {
      if (err) {
        bind.status = 0;
        bind.message = "Oops! error occured while fetching user reviews";
        bind.error = err;
      } else if (reviews) {
        bind.status = 1;
        bind.reviews = reviews;
      } else {
        bind.status = 0;
        bind.message = "No reviews Found";
      }

      return res.json(bind);
    }
  ).sort({
    _id: -1,
  });
};

exports.getExpertEmailFromToken = function (req, res, next) {
  const bind = {};
  ExpertSignupToken.findOne(
    {
      token: req.params.token,
    },
    (err, response) => {
      if (!err) {
        bind.status = 1;
        bind.message = "Expert found";
        bind.email = response.email;
        return bind;
      }
      bind.status = 0;
      bind.message = "Expert not found";
      bind.email = "";
      return bind;
    }
  );
};

function base64ToFile(base64) {
  if (!base64) return null;
  const name = new Date().getTime();
  let base64Data = "";
  let extension = "";
  if (base64.split(",")[0].includes("png") === true) {
    extension = "png";
  } else if (base64.split(",")[0].includes("jpg") === true) {
    extension = "jpg";
  } else if (base64.split(",")[0].includes("jpeg") === true) {
    extension = "jpeg";
  } else {
    return null;
  }
  base64Data = base64.replace(/^data:image\/[a-z]+;base64,/, "");
  filename = `${name}.${extension}`;
  fs.writeFileSync(
    `../client/public/profile_images/${filename}`,
    base64Data,
    "base64"
  );
  return filename;
}

exports.userExpertUpdate = async function (req, res) {
  let uploadedFile = req.files?.avater?.[0]
  let uploadedCover = req.files?.coverImage?.[0];
  const slug = req.params.slug;
  let  imageUrl ;
  imageUrl = uploadedFile ? {
    location: uploadedFile.location,
    key: uploadedFile.key,
    cdnUrl: MEDIA_CDN_URL + "profile/" + uploadedFile.key,
  }:null
  let coverImage;
  coverImage = uploadedCover ? {
    location: uploadedCover.location,
    key: uploadedCover.key,
    cdnUrl: MEDIA_CDN_URL + "profile/" + uploadedCover.key,
  } : null 

  const user = User.findOne({slug:slug});
  if(user.imageUrl && imageUrl){
    await deleteFile(user.imageUrl.key,"profile")
  }
  if(user.coverImage && coverImage){
    await deleteFile(user.coverImage.key,"profile")
  }
  let updateuser = {};
  if (typeof(req.body.experties)==="string"){
    updateuser.experties = JSON.parse(req.body.experties);
  }else{
    updateuser.experties = req.body.experties; 
  }
  if (typeof(req.body.community)==="string"){
    updateuser.community = JSON.parse(req.body.community);
  }else{
    updateuser.community = req.body.community;

  }
  updateuser.nationality = req.body.nationality;
  updateuser.imageUrl = imageUrl ? imageUrl : null;
  updateuser.coverImage = coverImage ? coverImage : null;
  updateuser.currentLocation = req.body.currentLocation;
  updateuser.userBio = req.body.userBio;
  // updateuser.additionalLinks = req.body.additionalLinks ? JSON.parse(req.body.additionalLinks) : [];
  updateuser.imageUrl ?  updateuser.imageUrl: delete updateuser.imageUrl
  updateuser.coverImage ?updateuser.coverImage  : delete updateuser.coverImage

  try {
    let profile = await User.findOneAndUpdate(
      { slug: slug },
      updateuser,
      { new: true, upsert: true }
    );
    return res.status(201).json({
      success: true,
      user_data: profile,
      message: "Data updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      error: error,
    });
  }
};

exports.userExpertDelete = async function (req, res, next) {
  try{
  const slug = req.params.slug;
  await Media.deleteMany({userSlug:slug})
  User.findOneAndDelete({ slug: slug }, () => {
    return res.status(200).json({
      success: true,
    });
  });
  }
  catch(err){
    return res.status(500).json(err) 
  }
};

exports.userExpert = function (req, res, next) {
  const { email } = req.body;
  const firstName =
    req.body.firstName !== "undefined" ? req.body.firstName : "";
  const contact =
    req.body.expertContact !== "undefined" ? req.body.expertContact : "";
  const expertContactCC =
    req.body.expertContactCC !== "undefined" ? req.body.expertContactCC : "";
  const { lastName } = req.body;
  const { password } = req.body;
  let slug = `${req.body.firstName}-${req.body.lastName}`;
  const role = "Expert";
  const { userBio } = req.body;
  const { expertRates } = req.body;
  const university =
    req.body.university !== "undefined" ? req.body.university : "";
  // const expertCategories = req.body.expertCategories !== 'undefined' ? req.body.expertCategories : '';
  const expertCategories = req.body.expertSubCategories;

  const { expertRating } = req.body;
  const expertFocusExpertise =
    req.body.expertFocusExpertise !== "undefined"
      ? req.body.expertFocusExpertise
      : "";
  const yearsexpertise =
    req.body.yearsexpertise !== "undefined" ? req.body.yearsexpertise : "";
  const isMusician = req.body.isMusician && req.body.isMusician;

  const facebookURL = req.body.facebookLink;
  const twitterURL = req.body.twitterLink;
  const instagramURL = req.body.instagramLink;
  const googleURL = req.body.googleLink;
  const linkedinURL = req.body.linkedinLink;
  const snapchatURL = req.body.snapchatLink ? req.body.snapchatLink : "";
  const youtubeURL = req.body.youtubeLink ? req.body.youtubeLink : "";
  const soundcloudURL = req.body.soundcloudLink ? req.body.soundcloudLink : "";
  const { endorsements } = req.body;
  const { myFavorite } = req.body;
  const expertUniversity = req.body.expertUniversity
    ? req.body.expertUniversity
    : "";
  const profileImage = req.files
    ? `/uploads/${Date.now()}-${req.files.profile.name}`
    : "";
  const resume_path = req.files
    ? `/uploads/${Date.now()}-${req.files.resume.name}`
    : "";
  const emailtest1 = new RegExp("@stanford.edu").test(email);
  const emailtest2 = new RegExp("@harvard.edu").test(email);

  if (!firstName || !lastName) {
    return res.json({
      code: 422,
      success: false,
      error: "You must enter your full name.",
    });
  }

  if (!email) {
    return res.json({
      code: 422,
      success: false,
      error: "You must enter an email address.",
    });
  }

  if (req.body.token) {
    if (req.body.token && !(emailtest1 || emailtest2)) {
      return res.json({
        code: 422,
        success: false,
        error: "Email Should start with @stanford.edu  or @harvard.edu",
      });
    }
  }

  // Return error if no password provided

  if (!password) {
    return res.json({
      code: 422,
      success: false,
      error: "You must enter a password.",
    });
  }

  if (req.body.token) {
    if (!profileImage) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter a profile image.",
      });
    }
  }
  if (req.body.token) {
    if (!resume_path) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter a resume.",
      });
    }
  }

  if (req.body.token) {
    if (!expertCategories) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter expert Categories.",
      });
    }
  }
  if (req.body.token) {
    if (!contact) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter expert Contact.",
      });
    }
  }
  if (req.body.token) {
    if (!expertContactCC) {
      return res.json({
        code: 422,
        success: false,
        error: "You must enter expert ContactCC.",
      });
    }
  }

  if (req.files && req.files.profile) {
    const file = req.files.profile;
    file.mv(`./public${profileImage}`, (err, response) => {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("file uploaded");
      }
    });
  }

  if (req.files && req.files.resume) {
    const file = req.files.resume;
    file.mv(`./public${resume_path}`, (err, response) => {
      if (err) {
        console.log("Error", err);
      } else {
        console.log("file uploaded");
      }
    });
  }

  User.findOne(
    {
      email,
    },
    (err, existingUser) => {
      if (err) {
        return next(err);
      }

      opentok.createSession((error1, asession) => {
        opentok.createSession((error2, aRSession) => {
          opentok.createSession((error3, vSession) => {
            const videoSessionId = vSession.sessionId;
            const archiveSessionId = aRSession.sessionId;
            const audioSessionId = asession.sessionId;
            // If email is unique and password was provided, create account

            const user = new User({
              email,
              password,
              contact,
              expertContactCC,
              profile: {
                firstName,
                lastName,
              },
              slug,
              isMusician,
              userBio,
              university,
              profileImage,
              resume_path,
              expertRates,
              expertCategories,
              expertRating,
              expertFocusExpertise,
              yearsexpertise,
              facebookURL,
              twitterURL,
              soundcloudURL,
              googleURL,
              instagramURL,
              linkedinURL,
              youtubeURL,
              snapchatURL,
              role,
              videoSessionId,
              archiveSessionId,
              audioSessionId,
              expertUniversity,
              endorsements,
              myFavorite,
            });

            User.findOne(
              {
                slug,
              },
              (err2, slugfound) => {
                if (err2) {
                  return next(err2);
                }
                if (
                  slugfound &&
                  slugfound !== null &&
                  slugfound !== undefined &&
                  slugfound !== ""
                ) {
                  const t =
                    new Date().getHours().toString() +
                    new Date().getMinutes().toString() +
                    new Date().getSeconds().toString() +
                    new Date().getMilliseconds().toString();
                  slug += t;
                  user.slug = slug;

                  user.save((err1) => {
                    if (err1) {
                      return next(err1);
                    }

                    // sendExpertSignupSuccessEmail(user);
                    // deleteExpertSignupToken(user.email);
                    const userInfo = setUserInfo(user);
                    res.status(201).json({
                      success: true,
                      user: {
                        _id: user._id,
                        customerId: "",
                        expertCategories: "",
                        expertFocusExpertise: "",
                        expertRates: "",
                        expertRating: "",
                        facebookURL: "",
                        firstName: user.profile.firstName,
                        lastName: user.profile.lastName,
                        locationCity: "",
                        locationCountry: "",
                        gender: "",
                        profileImage: "",
                        email: user.email,
                        slug: user.slug,
                        role: user.role,
                        userBio: user.userBio,
                        profile: {
                          firstName: user.profile.firstName,
                          lastName: user.profile.lastName,
                        },
                        endorsements: "",
                        myFavorite: "",
                      },
                      message: "Account Created Successfully",
                      token: `JWT ${generateToken(userInfo)}`,
                    });
                  });
                } else {
                  user.save((err1, savedUser) => {
                    if (err1) {
                      console.log("[ERROR]:", err1);
                      return next(err1);
                    }

                    sendExpertSignupSuccessEmail(savedUser);
                    deleteExpertSignupToken(savedUser.email);
                    const userInfo = setUserInfo(savedUser);
                    res.status(201).json({
                      success: true,
                      user: {
                        _id: user._id,
                        customerId: "",
                        expertCategories: "",
                        expertFocusExpertise: "",
                        expertRates: "",
                        expertRating: "",
                        facebookURL: "",
                        firstName: savedUser.profile.firstName,
                        lastName: savedUser.profile.lastName,
                        locationCity: "",
                        locationCountry: "",
                        gender: "",
                        profileImage,
                        resume_path,
                        email: savedUser.email,
                        slug: savedUser.slug,
                        role: savedUser.role,
                        userBio: savedUser.userBio,
                        profile: {
                          firstName: savedUser.profile.firstName,
                          lastName: savedUser.profile.lastName,
                        },
                        endorsements: "",
                        myFavorite: "",
                      },
                      message: "Account Created Successfully",
                      token: `JWT ${generateToken(userInfo)}`,
                    });
                  });
                }
              }
            );
          });
        });
      });
    }
  );
};

exports.getExpertReviews = function (req, res, next) {
  const bind = {};
  const { expertSlug } = req.params;
  UserReview.find(
    {
      expertSlug,
      // reviewBy: "User"
    },
    (err, reviews) => {
      if (err) {
        bind.status = 0;
        bind.message = "Oops! error occured while fetching user reviews";
        bind.error = err;
      } else if (reviews) {
        bind.status = 1;
        bind.reviews = reviews;
      } else {
        bind.status = 0;
        bind.message = "No reviews Found";
      }

      return res.json(bind);
    }
  ).sort({
    _id: -1,
  });
};

exports.getExpertsSubCategoryList = function (req, res) {
  Experts.aggregate(
    [
      {
        $match: {
          slug: req.params.category,
        },
      },
    ],
    (err, subcategory) => {
      if (err) {
        return res.status(200).json(err);
      }

      return res.status(200).json(subcategory);
    }
  );
};

exports.getTopicsInSubCategory = async function (req, res) {
  // const experts = await Experts.find({
  //   "subcategory.slug": req.params.subCategory,
  // });
  Experts.aggregate(
    [
      {
        $match: {
          "subcategory.slug": req.params.subCategory,
        },
      },
      {
        $project: {
          _id: 0,
          "subcategory.name": 1,
          "subcategory.slug": 1,
          "subcategory.topics": 1,
        },
      },
    ],
    (err, subcategory) => {
      if (err) {
        return res.status(200).json(err);
      }

      return res.status(200).json(subcategory);
    }
  );
};

exports.upload = function (req, res, next) {
  let filename = "";
  const d = new Date();
  const name = d.getTime();

  if (req.body.base64_image) {
    let base64Data = "";
    let extension = "";
    if (req.body.base64_image.split(",")[0].includes("png") === true) {
      extension = "png";
      base64Data = req.body.base64_image.replace(
        /^data:image\/png;base64,/,
        ""
      );

      filename = `${name}.${extension}`;
      fs.writeFile(
        `../client/public/profile_images/${filename}`,
        base64Data,
        "base64",
        (err) => {
          console.log(err);
        }
      );
    } else if (req.body.base64_image.split(",")[0].includes("jpg") === true) {
      extension = "jpg";
      base64Data = req.body.base64_image.replace(
        /^data:image\/jpg;base64,/,
        ""
      );

      filename = `${name}.${extension}`;
      fs.writeFile(
        `../client/public/profile_images/${filename}`,
        base64Data,
        "base64",
        (err) => {
          console.log(err);
        }
      );
    } else if (req.body.base64_image.split(",")[0].includes("jpeg") === true) {
      base64Data = req.body.base64_image.replace(
        /^data:image\/jpeg;base64,/,
        ""
      );
      extension = "jpeg";

      filename = `${name}.${extension}`;
      fs.writeFile(
        `../client/public/profile_images/${filename}`,
        base64Data,
        "base64",
        (err) => {
          console.log(err);
        }
      );
    }
  }

  const updateuser = {};
  if (filename !== "") {
    updateuser.profileImage = filename;
  }

  User.findOneAndUpdate(
    { _id: req.body.user_id },
    updateuser,
    { new: true },
    (err4, user_obj) => {
      if (err4) {
        console.log("error occured");
        console.log(err4);
        return next(err4);
      }
      // console.log('updated successfully');
      res.status(201).json({
        success: true,
        profile_image: user_obj.profile.profileImage,
        user_data: user_obj,
        message: "Data updated Successfully",
      });
    }
  );
};

exports.uploadFile = (req, resp) => {
  const fileinfo = req.file;
  console.log(fileinfo, "uploaded");
  resp.send({ type: "success", filename: fileinfo.filename });
};

exports.uploadS3 = async (req, res) => {
  try {
    const uploadedFile = req.files.file[0];

    if (!uploadedFile) {
      res.status(401).json({
        status: false,
        message: "File not uploaded",
      });
    } else {
      const resData = {
        location: uploadedFile.location,
        key: uploadedFile.key,
        cdnUrl: MEDIA_CDN_URL + "profile/" + uploadedFile.key,
      };
      res.status(200).json(resData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

exports.resumeUploadS3 = async (req, res) => {
  try {
    const uploadedFile = req.files.file[0];

    if (!uploadedFile) {
      res.status(401).json({
        status: false,
        message: "File not uploaded",
      });
    } else {
      const resData = {
        location: uploadedFile.location,
        key: uploadedFile.key,
        cdnUrl: MEDIA_CDN_URL + "resume/" + uploadedFile.key,
      };
      res.status(200).json(resData);
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

// Save profile image to database
exports.uploadImage = async function (req, res) {
  const { cdnUrl, key, location, user_email } = req.body;
  let user_obj;

  if (user_email) {
    try {
      user_obj = await User.findOne({ email: user_email });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
  try {
    let updateuser = {
      imageUrl: {
        cdnUrl: cdnUrl,
        key: key,
        location: location,
      },
    };

    let profile = await User.findOneAndUpdate(
      { _id: user_obj._id },
      updateuser,
      { new: true }
    );
    return res.status(201).json({
      success: true,
      user_data: profile,
      message: "Data updated Successfully",
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({
      error: true,
      error: error,
    });
  }
};

//detete profile picture

exports.deleteImage = async function (req, res) {
  const { user_email, key } = req.body;
  if (user_email) {
    let updateuser = {
      imageUrl: {
        cdnUrl:
          "https://donnysliststory.sfo3.cdn.digitaloceanspaces.com/profile/profile.png",
      },
    };
    try {
      let profile = await User.findOneAndUpdate(
        { email: user_email },
        updateuser,
        { new: true }
      );
      return res.status(201).json({
        success: true,
        user_data: profile,
        message: "Profile Picture Deleted",
      });
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
};


exports.searchExperts = async (req, res) => {
  const { query } = req.query;
  console.log(query);

  const regexString = `.*${query}.*`;

  try {
    let results = await User.find({
      $or: [
        { "profile.firstName": { $regex: regexString, $options: "i" } }, // /.*${query}.*/i },
        { "profile.lastName": { $regex: regexString, $options: "i" } },
      ],
    });

    results = results.map((result) => ({
      _id: result._id,
      firstName: result.profile.firstName,
      lastName: result.profile.lastName,
      peerId: result.peerId,
      profileImage: result.imageUrl?.cdnUrl,
      audioRoomRole: result.audioRoomRole,
    }));

    return res.status(200).json(results);
  } catch (err) {
    console.log("[AUDIOROOM]:[ERR]:[SEARCHEXPERTS]", err);
    return res.status(500).json(err);
  }
};

exports.updateRoomParticipantInfo = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate({ _id: req.params.id }, req.body, {
      new: true,
    });

    return res.status(200).json(user);
  } catch (err) {
    return res.status(500).json(err);
  }
};

exports.updateAudioCallUser = async (userId, data) => {
  try {
    const user = await User.findOneAndUpdate({ _id: userId }, data, {
      new: true,
    });

    return user;
  } catch (err) {
    console.log(err);
    return err;
  }
};

exports.getUserOnlineStatus = async (req, res) => {
  try{
    const status = await userStatus.findOne({userSlug:req.params.slug});
    res.status(200).json(status)
  }
 catch(error){
  res.status(500).json(error)
 }
};
exports.getAllOnlineStatus = async (req, res) => {
  try{
    // const all = userStatus.distinct("userSlug")
    const status = await userStatus.find({});
    res.status(200).json(status)
  }
 catch(error){
  console.log(error)
  res.status(500).json(error)
 }
};
exports.getUserFriendsOnlineStatus = async (req, res) => {
  try{
    const userSlug = req.params.slug;
    const members = await conversation.find({ members: { $in: userSlug } })
      .sort({ updatedAt: -1 });
    const peer = [];
    for (let i = 0; i < members.length; i++) {
      for (let j = 0; j < members[i].members.length; j++) {
        if (members[i].members[j] !== userSlug) {
          peer.push(members[i].members[j]);
        }
      }
    }
    const status = await userStatus.findOne({userSlug:{"$in" : peer}});
    res.status(200).json(status)
  }
 catch(error){
  console.log(error)
  res.status(500).json(error)
 }
};
