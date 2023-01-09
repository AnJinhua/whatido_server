require('dotenv').config()
const JwtStrategy = require('passport-jwt').Strategy
const { ExtractJwt } = require('passport-jwt')
const LocalStrategy = require('passport-local')
const FacebookStrategy = require('passport-facebook').Strategy
const TwitterStrategy = require('passport-twitter').Strategy
const GoogleStrategy = require('passport-google-oauth20').Strategy
const jwt = require('jsonwebtoken')
const User = require('../models/user')
const config = process.env
const { setUserInfo } = require('../helpers')
const otpGenerator = require('otp-generator')
const Code = require('../models/regCode')
const bcrypt = require('bcrypt')

const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme('jwt'),
  secretOrKey: config.secret,
}

const localOptions = {
  usernameField: 'email',
}

function generateToken(user) {
  return jwt.sign(user, config.secret, {
    expiresIn: 604800, // in seconds
  })
}

module.exports = (passport) => {
  passport.serializeUser((user, done) => {
    if (user.status === 'LOGIN') {
      done(null, user.data._id)
    } else {
      done(null, user.data)
    }
  })

  passport.deserializeUser(async (id, done) => {
    const user = await User.findById(id).catch((err) => {
      // console.log('Error deserializing', err)
      // done(err, null)
    })
    if (user) {
      done(null, user)
    } else {
      done(null, id)
    }
  })

  passport.use(
    new GoogleStrategy(
      {
        clientID: config.GOOGLE_CLIENT_ID,
        clientSecret: config.GOOGLE_CLIENT_SECRET,
        callbackURL: '/auth/google/callback',
      },
      async (accessToken, refreshToken, profile, done) => {
        try {
          let user = await User.findOne({ email: profile._json.email })

          if (user) {
            console.log('google display')
            const userInfo = setUserInfo(user)
            user.jwtLoginAccessToken = `JWT ${generateToken(userInfo)}`

            user.onlineStatus = 'ONLINE'
            user.loginSource = 'Gmail'
            user.save((err1) => {
              if (err1) {
                console.log(`error occured while saving: ${err1}`)
              } else {
                console.log('** ** ** generateToken user')
                const loginData = {
                  status: 'LOGIN',
                  data: user,
                  message: 'login successful',
                }
                return done(null, loginData)
              }
            })
          } else {
            // Generate OTP
            const CODE = otpGenerator.generate(4, {
              digits: true,
              lowerCaseAlphabets: false,
              upperCaseAlphabets: false,
              specialChars: false,
            })

            //Hash Code
            const code = new Code({
              email: profile.emails[0].value,
              code: CODE,
            })
            bcrypt.genSalt(5, async (err, salt) => {
              if (err) return next(err)
              bcrypt.hash(code.code, salt, (err1, hash) => {
                if (err1) return next(err1)
                code.code = hash
              })

              //save Code
              const result = await code.save()
              const SignUpData = {
                status: 'SIGNUP',
                data: {
                  email: profile.emails[0].value,
                  code: CODE,
                },
                message: 'Finsih SignUp',
              }

              return done(null, SignUpData)
            })

          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )

  passport.use(
    new FacebookStrategy(
      {
        clientID: config.facebookAuthClientID,
        clientSecret: config.facebookAuthClientSecret,
        callbackURL: config.facebookAuthCallbackURL,
        // passReqToCallback : true,
        profileFields: [
          'id',
          'emails',
          'picture.type(large)',
          'name',
          'birthday',
          'about',
          'gender',
        ],
      },
      async (token, refreshToken, profile, done) => {
        console.log(profile)
        try {
          let user = await User.findOne({ email: profile.emails[0].value })
          console.log('facebook login')

          if (user) {
            const userInfo = setUserInfo(user)

            user.jwtLoginAccessToken = `JWT ${generateToken(userInfo)}`
            user.loginSource = 'Facebook'
            user.onlineStatus = 'ONLINE'
            user.save((err1) => {
              // console.log(`** ** ** generateToken user : ${doc}`)
              if (err1) {
                console.log(`error occured while saving: ${err1}`)
              } else {
                console.log('** ** ** generateToken user')
                const loginData = {
                  status: 'LOGIN',
                  data: user,
                  message: 'login successful',
                }
                return done(null, loginData)
              }
            })
          } else {
            // Generate OTP
            const CODE = otpGenerator.generate(4, {
              digits: true,
              lowerCaseAlphabets: false,
              upperCaseAlphabets: false,
              specialChars: false,
            })

            //Hash Code
            const code = new Code({
              email: profile.emails[0].value,
              code: CODE,
            })
            bcrypt.genSalt(5, async (err, salt) => {
              if (err) return next(err)
              bcrypt.hash(code.code, salt, (err1, hash) => {
                if (err1) return next(err1)
                code.code = hash
              })

              //save Code
              const result = await code.save()
              const SignUpData = {
                status: 'SIGNUP',
                data: {
                  email: profile.emails[0].value,
                  code: CODE,
                },
                message: 'Finsih SignUp',
              }

              return done(null, SignUpData)
            })
            
          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )

  // =========================================================================
  // TWITTER =================================================================
  // =========================================================================
  passport.use(
    new TwitterStrategy(
      {
        consumerKey: config.twitterAuthConsumerKey,
        consumerSecret: config.twitterAuthConsumerSecret,
        callbackURL: config.twitterAuthCallbackURL,
        includeEmail: true,
      },
      async (token, tokenSecret, profile, done) => {
        try {
          let user = await User.findOne({ email: profile.emails[0].value })

          // if the user is found, then log them in
          if (user) {
            const userInfo = setUserInfo(user)
            user.jwtLoginAccessToken = `JWT ${generateToken(userInfo)}`
            user.loginSource = 'Twitter'
            user.save(function (err, doc) {
              console.log('** ** ** generateToken user : ' + doc)
              const loginData = {
                status: 'LOGIN',
                data: user,
                message: 'login successful',
              }
              return done(null, loginData)
            })
          } else {
            // Generate OTP
            const CODE = otpGenerator.generate(4, {
              digits: true,
              lowerCaseAlphabets: false,
              upperCaseAlphabets: false,
              specialChars: false,
            })

            //Hash Code
            const code = new Code({
              email: profile.emails[0].value,
              code: CODE,
            })
            bcrypt.genSalt(5, async (err, salt) => {
              if (err) return next(err)
              bcrypt.hash(code.code, salt, null, (err1, hash) => {
                if (err1) return next(err1)
                code.code = hash
              })

              //save Code
              const result = await code.save()
              const SignUpData = {
                status: 'SIGNUP',
                data: {
                  email: profile.emails[0].value,
                  code: CODE,
                },
                message: 'Finsih SignUp',
              }

              return done(null, SignUpData)
            })
          }
        } catch (err) {
          console.error(err)
        }
      }
    )
  )

  passport.use(
    new LocalStrategy(localOptions, (email, password, done) => {
      User.findOne({ email }, (err, user) => {
        if (err) {
          return done(err)
        }
        if (!user) {
          return done(null, false, {
            error:
              'Your login details could not be verified. Please try again.',
          })
        }
        user.comparePassword(password, (err1, isMatch) => {
          if (err1) {
            return done(err1)
          }
          if (!isMatch) {
            return done(null, false, {
              error:
                'Your login details could not be verified. Please try again.',
            })
          }
          if (
            user.enableAccount &&
            user.enableAccount !== null &&
            user.enableAccount !== undefined &&
            user.enableAccount === true
          ) {
            user.onlineStatus = 'ONLINE'
            user.save((err2, doc) => {
              const Data = {
                data: doc,
              }
              return done(null, Data)
            })
          } else {
            return done(null, { message: "you've been Banned", status: false })
          }
        })
      })
    })
  )

  passport.use(
    new JwtStrategy(jwtOptions, (payload, done) => {
      User.findById(payload._id, (err, user) => {
        if (err) {
          return done(err, false)
        }
        if (user) {
          if (
            user.enableAccount &&
            user.enableAccount !== null &&
            user.enableAccount !== undefined &&
            user.enableAccount === true
          ) {
            const Data = {
              data: user,
            }
            return done(null, Data)
          } else {
            done(null, false, { message: 'Sorry the account is banned' })
          }
        } else {
          done(null, false)
        }
      })
    })
  )
}
