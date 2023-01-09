require('dotenv').config()

const mailchimp = require('mailchimp-v3');
const config = process.env;

mailchimp.setApiKey(config.mailchimpApiKey);

const listID = '';

// ========================
// Subscribe to main list
// ========================
exports.subscribeToNewsletter = (email) => {
  mailchimp
    .post(`lists/${listID}/members`, {
      email_address: email,
      status: 'subscribed'
    })
    .then((result) => {
      console.log('[MAILCHIMP]:[RESULT]:', result);
      console.log(`${email} has been subscribed to Mailchimp.`);
    })
    .catch((err) => {
      console.log('[MAILCHIMP]:[ERROR]:', err);
    });
};
