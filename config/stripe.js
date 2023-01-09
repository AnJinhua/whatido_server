require('dotenv').config()
const Stripe = require('stripe');
const config = process.env;

const stripe = Stripe(config.stripeApiKey, { timeout: 20000 });

module.exports = stripe;
