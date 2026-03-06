const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',  // ✅ explicit host instead of service
    port: 587,               // ✅ port 587 works on Render
    secure: false,           // ✅ false for port 587
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // ✅ must be App Password
    }
});

const sendOTPEmail = async (email, name, otp) => {
    const mailOptions = {
        from: `"BookYourEvent" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email — BookYourEvent',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #1e4d5c; margin-bottom: 4px;">BookYourEvent</h2>
            <p style="color: #888; font-size: 12px; margin-top: 0;">EASY. BOOK. ENJOY.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p style="color: #333;">Hi <strong>${name}</strong>,</p>
            <p style="color: #555;">Use the OTP below to verify your email. It expires in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
                <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1e4d5c;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px;">If you didn't create an account, ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;"/>
            <p style="color: #ccc; font-size: 11px; text-align: center;">© 2026 BookYourEvent. All rights reserved.</p>
        </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, name) => {
    const mailOptions = {
        from: `"BookYourEvent" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to BookYourEvent! 🎉',
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #1e4d5c;">Welcome to BookYourEvent! 🎉</h2>
            <p style="color: #555;">Hi <strong>${name}</strong>, your account is verified and ready to use.</p>
            <p style="color: #555;">Start exploring hundreds of venues in Bangalore.</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.CLIENT_URL}/login"
                   style="background: #1e4d5c; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: bold;">
                    Start Booking →
                </a>
            </div>
            <p style="color: #ccc; font-size: 11px; text-align: center;">© 2026 BookYourEvent</p>
        </div>
        `
    };
    await transporter.sendMail(mailOptions);
};

module.exports = { sendOTPEmail, sendWelcomeEmail };
