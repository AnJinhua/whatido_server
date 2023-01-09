const config = process.env;
const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars");
const path = require("path");
const sendGridTransport = require("nodemailer-sendgrid-transport");

const handlebarOptions = {
  viewEngine: {
    partialsDir: path.resolve("./views"),
    defaultLayout: false,
  },
  viewPath: path.resolve("./views"),
};

const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key: config.SENDGRID_API,
    },
  })
);

transporter.use("compile", hbs(handlebarOptions));


exports.newMessageNotifications = async (req, res) => {
 const { senderName, recieverEmail, message, recieverName, url } = req.body;
  const mailOptions = {
    from: `${senderName} via what i do <no-reply@whatido.app>`,
    to: recieverEmail,
    subject: `${senderName}, awaits your response`,
    template: "newMessage",
    context: {
      senderName: senderName,
      recieverName: recieverName,
      message: message,
      url: url,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`email notification sent to ${recieverEmail}`);
      res.status(200).json(info);
    }
  });
}

//send zoom email notificiation
exports.sendZoomEmailNotification = async (req, res) => {
  const { senderName, recieverEmail, recieverName, url, } =
    req.body;
  const mailOptions = {
    from: `${senderName} via what.i.do <no-reply@whatido.app>`,
    to: recieverEmail,
    subject: `${senderName}, invited you to a zoom call`,
    template: "zoomInvite",
    context: {
      senderName: senderName,
      recieverName: recieverName,
      url: url,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`Email Notification sent to ${recieverEmail}`);
      res.status(200).json(info);
    }
  });
};

exports.sendAudioRoomEmailNotification = async (req, res) => {
  const {
    senderName,
    recieverEmail,
    message,
    recieverName,
    url,
  } = req.body;
  const mailOptions = {
    from: `${senderName} via whatido <no-reply@whatido.app>`,
    to: recieverEmail,
    subject: `${senderName}, invited you to their audio room`,
    template: "audioRoomInvite",
    context: {
      recieverName: recieverName,
      message: message,
      url: url,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`Email Notification sent to ${recieverEmail}`);
      res.status(200).json(info);
    }
  });
};

//send story repy notification
exports.sendStoryReplyNotification = async (req, res) => {
  const { senderName, recieverEmail, message, recieverName, url, baseUrl } =
    req.body;
  const mailOptions = {
    from: `${senderName} via whatido.app <no-reply@whatido.app>`,
    to: recieverEmail,
    subject: `${senderName}, repied to your story`,
    template: "storyReply",
    context: {
      senderName: senderName,
      recieverName: recieverName,
      message: message,
      url: url,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`Email Notification sent to ${recieverEmail}`);
      res.status(200).json(info);
    }
  });
};
//send story repy notification
exports.sendForgotPasswordEmail = async (otp, email, res) => {
 
  const mailOptions = {
    from: `whatido.app <no-reply@whatido.app>`,
    to: email,
    subject: `forgot password otp`,
    template: "forgotPassword",
    context: {
      otp: otp,
      email: email,
    },
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("In error of nodemailer");
      res.status(500).json(error);
    } else {
      console.log(`Email Notification sent to ${email}`);
      res.status(200).json({info});
    }
  });
};