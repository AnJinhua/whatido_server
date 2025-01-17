require('dotenv').config()
const sendGrid = require("sendgrid");
const config = process.env;

const helper = sendGrid.mail;
const sg = sendGrid(config.sendgridApiKey);
const fromEmail = new helper.Email("info@yourdomain.com");

// Create and export function to send emails through Mailgun API
exports.sendEmail = function sendEmail(recipient, message) {
  const toEmail = new helper.Email(recipient);
  const content = new helper.Content("text/plain", message.text);
  const mail = new helper.Mail(fromEmail, message.subject, toEmail, content);
  const request = sg.emptyRequest({
    method: "POST",
    path: "/v3/mail/send",
    body: mail.toJSON(),
  });
  sg.API(request, (error, response) => {
    console.log(response.statusCode);
    console.log(response.body);
    console.log(response.headers);
  });
};

//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
