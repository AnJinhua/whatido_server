require('dotenv').config()
const nodemailer = require("nodemailer");

const config = process.env;
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { ROLE_ADMIN } = require("./constants");
const { ROLE_EXPERT } = require("./constants");
const { ROLE_USER } = require("./constants");
const path = require("path");
const ExpertSignupToken = require("./models/expertsignuptoken");
const hbs = require("nodemailer-express-handlebars");

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

// Set user info from request
exports.setUserInfo = function setUserInfo(request) {
  const getUserInfo = {
    _id: request._id,
    firstName: request.profile.firstName,
    lastName: request.profile.lastName,
    email: request.email,
    imageUrl: request.imageUrl ? request.imageUrl : null,
    coverImage: request.coverImage ? request.coverImage : null,
    slug: request.slug,
    experties:request.experties,
    community:request.community,
    nationality:request.nationality,
    currentLocation:request.currentLocation,
    additionalLinks:request.additionalLinks,
    expertRating: request.expertRating,
    userBio: request.userBio,
    locationCity: request.locationCity,
  };

  return getUserInfo;
};

exports.getRole = function getRole(checkRole) {
  let role;

  switch (checkRole) {
    case ROLE_USER:
      role = 3;
      break;
    case ROLE_EXPERT:
      role = 2;
      break;
    case ROLE_ADMIN:
      role = 1;
      break;
    default:
      role = 1;
  }

  return role;
};

exports.sendRegistrationEmail = function sendRegistrationEmail(userInfo) {
  const siteName = "What i do";
  // email header and footer
  const emailHtmlHead = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${siteName} Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>`;

  // const emailHtmlHeader =
  //  `<div class="content-container" style="padding:18px;"><!doctype html><html> \
  // <head><meta charset="utf-8"> \
  // <meta name="viewport" content="width=device-width, initial-scale=1"><title>${ \
  //  siteName \
  //  } Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;position:relative;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com:3000/uploads/Donnys-List.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>`;

  const emailHtmlFoot = "</body></html>";

  let htmlC = `${emailHtmlHead}<div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table><div class="content-container" style="padding:18px;">`;

  htmlC = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${siteName} Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;position:relative;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table><div class="content-container" style="padding:18px;">`;
  htmlC += `<h3>Welcome to ${siteName}!</h3><p>Good Day To You, Thank you for registering with us!</p>`;
  htmlC += `<p>To keep up with all the latest events at ${siteName} please follow us on:</p>`;
  htmlC +=
    '<p><table width="100%" align="center"> <tbody> <tr> <td align="center"> <br> <a href="https://www.facebook.com" target="_blank" style="text-decoration:none;"> <img src="https://image.flaticon.com/icons/png/128/145/145802.png" border="0" hspace="3" width="34" height="32" style="border-radius: 20px;"> </a> <a href="https://twitter.com/" target="_blank" style="text-decoration:none;"> <img src="https://image.flaticon.com/icons/png/128/145/145812.png" border="0" hspace="3" width="34" height="32" style="border-radius: 20px;"> </a> <a href="https://www.instagram.com/" target="_blank" style="text-decoration:none;"> <img src="https://image.flaticon.com/icons/png/128/187/187207.png" border="0" hspace="3" width="34" height="32" style="border-radius: 20px;"> </a></td> </tr> </tbody> </table></p>';
  htmlC += "<p>We thank you,</p>";
  htmlC += `<p>Team ${siteName}</p></div><table width="100%" align="center"><tbody> <tr> <td align="center"> <br> <a href="https://www.donnieslist.com/contact-us" target="_blank" style="font-size:10px;color:#666666;">Contact Us</a> </td> </tr> </tbody> </table></div>${emailHtmlFoot}`;

  const mailOptions = {
    from: `${siteName} <no-reply@whatido.app>`,
    to: userInfo.email,
    subject: `Welcome to ${siteName}!`,
    html: htmlC,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      console.log("In error of nodemailer");
      console.log(error);
    } else {
      //  console.log('Message sent to user: ' /* + JSON.stringify(info)*/);
    }
  });
};

/* send email to expert for signup using homepage only for stanford & hardvard professionals */
exports.sendExpertSignupTokenEmail = function sendExpertSignupTokenEmail(
  userInfo
) {
  const siteName = "Donnie's List";
  // email header and footer
  const emailHtmlHead = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${siteName} Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>`;

  // const emailHtmlHeader =
  //  `<div class="content-container" style="padding:18px;"> \
  // <!doctype html><html><head><meta charset="utf-8">< \
  // meta name="viewport" content="width=device-width, initial-scale=1"><title>${ \
  //  siteName \
  //  } Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;position:relative;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com:3000/uploads/Donnys-List.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>`;

  const emailHtmlFoot = "</body></html>";

  let htmlC = `${emailHtmlHead}<div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>  <div class="content-container" style="padding:18px;">`;

  const signupLink = `${config.website_url}/expert-signup/${userInfo.token}`;

  htmlC = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${siteName} Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;position:relative;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>   <div class="content-container" style="padding:18px;">`;
  htmlC += `<h3>Welcome to ${siteName}!</h3><p>Good Day To You, Thank you for requesting for Expert account!</p>`;
  htmlC += `<p>Please <a href=${signupLink}>click here</a> to proceed with signup</p>`;
  htmlC += "<p>We thank you,</p>";
  htmlC += `<p>Team ${siteName}</p></div><table width="100%" align="center"><tbody> <tr> <td align="center"> <br> <a href="https://www.donnieslist.com/contact-us" target="_blank" style="font-size:10px;color:#666666;">Contact Us</a> </td> </tr> </tbody> </table></div>${emailHtmlFoot}`;

  const mailOptions = {
    from: "mobile.worldev@gmail.com",
    to: userInfo.email,
    // to     : 'ermohit400@yahoo.com',
    subject: `Welcome to ${siteName}! Signup as Expert`,
    html: htmlC,
  };
  // console.log('mail options =======> ', mailOptions);

  // console.log(config.gmailEmail, config.gmailPassword);
  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      //  console.log('In error of nodemailer');
      //  console.log(error);
    } else {
      //  console.log('Message sent to user: ' /* + JSON.stringify(info)*/);
    }
  });
};

/* send email to expert after successfull signup */
exports.sendExpertSignupSuccessEmail = function sendExpertSignupSuccessEmail(
  userInfo
) {
  const siteName = "Donnie's List";
  // email header and footer
  const emailHtmlHead = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${siteName} Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>`;
  // const emailHtmlHeader =
  //  `<div class="content-container" style="padding:18px;">
  // <!doctype html><html><head><meta charset="utf-8">
  // <meta name="viewport" content="width=device-width, initial-scale=1"><title>${
  //  siteName
  //  } Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;position:relative;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com:3000/uploads/Donnys-List.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>`;
  const emailHtmlFoot = "</body></html>";
  let htmlC = `${emailHtmlHead}<div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>  <div class="content-container" style="padding:18px;">`;
  // const signupLink = `${config.website_url}/expert-signup/${userInfo.token}`;

  htmlC = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${siteName} Registration</title></head><body><div style="width:580px;margin:0 auto;border:12px solid #f0f1f2;position:relative;color:#696969;font:14px Arial,Helvetica,sans-serif"><table align="center" width="100%" height="auto" style="position:relative" cellpadding="0" cellspacing="0"> <tbody> <tr> <td> <center><img src="https://www.donnieslist.com:3000/uploads/banner-email.jpg" border="0" width="100%" height="200" class="CToWUd a6T" tabindex="0"> <img src="https://www.donnieslist.com/img/donnieslist-logo.png" style="width: 35%;position: absolute;top: 150px;left: 10px;"><div class="a6S" dir="ltr" style="opacity: 0.01; left: 641px; top: 270px;"></div></center> </td> </tr> </tbody></table>   <div class="content-container" style="padding:18px;">`;
  htmlC += `<h3>Welcome to ${siteName}!</h3><p>Good Day To You, Thank you for registering with us!</p>`;
  htmlC +=
    "<p>Now you can access awesome features of Donnies List as an Expert.</p>";
  htmlC += "<p>We thank you,</p>";
  htmlC += `<p>Team ${siteName}</p></div><table width="100%" align="center"><tbody> <tr> <td align="center"> <br> <a href="https://www.donnieslist.com/contact-us" target="_blank" style="font-size:10px;color:#666666;">Contact Us</a> </td> </tr> </tbody> </table></div>${emailHtmlFoot}`;

  const mailOptions = {
    from: `${siteName} <no-reply@whatido.app>`,
    to: userInfo.email,
    // to     : 'ermohit400@yahoo.com',
    subject: `Welcome to ${siteName}! Successfully Registered`,
    html: htmlC,
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) {
      //  console.log('In error of nodemailer');
      //  console.log(error);
    } else {
      //  console.log('Message sent to user: ' /* + JSON.stringify(info)*/);
    }
  });
};

/* after successfull expert signup, token from expertsignuptokens
   table will be deleted to prevent miss use  */
exports.deleteExpertSignupToken = function deleteExpertSignupToken(userEmail) {
  // console.log(`userEmail: ${userEmail}`);
  ExpertSignupToken.remove({ email: userEmail }, (err) => {
    if (!err) {
      //  console.log('record deleted');
      return true;
    }
    // console.log('record not deleted');
    return false;
  });
};
