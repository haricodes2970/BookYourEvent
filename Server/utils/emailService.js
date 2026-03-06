const SibApiV3Sdk = require('sib-api-v3-sdk');

const client = SibApiV3Sdk.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi();

const sendOTPEmail = async (email, name, otp) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: 'BookYourEvent' };
    sendSmtpEmail.subject = 'Verify Your Email — BookYourEvent';
    sendSmtpEmail.htmlContent = `
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
        </div>`;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
};

const sendWelcomeEmail = async (email, name) => {
    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();
    sendSmtpEmail.to = [{ email, name }];
    sendSmtpEmail.sender = { email: process.env.EMAIL_USER, name: 'BookYourEvent' };
    sendSmtpEmail.subject = 'Welcome to BookYourEvent! 🎉';
    sendSmtpEmail.htmlContent = `
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
        </div>`;
    await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = { sendOTPEmail, sendWelcomeEmail };