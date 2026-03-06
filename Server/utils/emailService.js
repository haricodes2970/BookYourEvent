const Brevo = require('@getbrevo/brevo');

const client = Brevo.ApiClient.instance;
client.authentications['api-key'].apiKey = process.env.BREVO_API_KEY;

const apiInstance = new Brevo.TransactionalEmailsApi();

const sendOTPEmail = async (email, name, otp) => {
    const sendSmtpEmail = {
        to: [{ email, name }],
        sender: { email: process.env.EMAIL_USER, name: 'BookYourEvent' },
        subject: 'Verify Your Email — BookYourEvent',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #1e4d5c;">BookYourEvent</h2>
            <p>Hi <strong>${name}</strong>,</p>
            <p>Use the OTP below to verify your email. Expires in <strong>10 minutes</strong>.</p>
            <div style="text-align: center; margin: 32px 0;">
                <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #1e4d5c;">${otp}</span>
            </div>
            <p style="color: #999; font-size: 12px;">If you didn't create an account, ignore this email.</p>
        </div>`
    };
    await apiInstance.sendTransacEmail(sendSmtpEmail);
};

const sendWelcomeEmail = async (email, name) => {
    const sendSmtpEmail = {
        to: [{ email, name }],
        sender: { email: process.env.EMAIL_USER, name: 'BookYourEvent' },
        subject: 'Welcome to BookYourEvent! 🎉',
        htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: auto; padding: 32px; border-radius: 12px; border: 1px solid #e0e0e0;">
            <h2 style="color: #1e4d5c;">Welcome to BookYourEvent! 🎉</h2>
            <p>Hi <strong>${name}</strong>, your account is verified!</p>
            <div style="text-align: center; margin: 32px 0;">
                <a href="${process.env.CLIENT_URL}/login"
                   style="background: #1e4d5c; color: white; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
                    Start Booking →
                </a>
            </div>
        </div>`
    };
    await apiInstance.sendTransacEmail(sendSmtpEmail);
};

module.exports = { sendOTPEmail, sendWelcomeEmail };