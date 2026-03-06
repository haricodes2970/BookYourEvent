const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${process.env.BASE_URL}/api/auth/google/callback`
},
async (accessToken, refreshToken, profile, done) => {
    try {
        const email = profile.emails[0].value;
        const name = profile.displayName;

        let user = await User.findOne({ email });

        if (user) {
            if (!user.isVerified) {
                user.isVerified = true;
                await user.save();
            }
            return done(null, user);
        }

        user = await User.create({
            name,
            email,
            password: 'GOOGLE_AUTH_' + Math.random().toString(36),
            phone: 'N/A',
            role: 'booker',
            isVerified: true
        });

        return done(null, user);

    } catch (err) {
        console.error('Google OAuth error:', err);
        return done(err, null);
    }
}));

module.exports = passport;