const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/* ══════════════════════════════════════
   OTP EMAIL
══════════════════════════════════════ */
const sendOTPEmail = async (email, name, otp) => {
    await transporter.sendMail({
        from:    `"BookYourEvent" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: 'Your OTP — BookYourEvent',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8f6f2;border-radius:16px;">
                <h2 style="color:#1e4d5c;">Hey ${name} 👋</h2>
                <p style="color:#555;">Your OTP to verify your BookYourEvent account:</p>
                <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#C8A45B;margin:24px 0;">${otp}</div>
                <p style="color:#888;font-size:13px;">Valid for 10 minutes. Do not share this with anyone.</p>
            </div>`,
    });
};

/* ══════════════════════════════════════
   WELCOME EMAIL
══════════════════════════════════════ */
const sendWelcomeEmail = async (email, name) => {
    await transporter.sendMail({
        from:    `"BookYourEvent" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: 'Welcome to BookYourEvent 🎉',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8f6f2;border-radius:16px;">
                <h2 style="color:#1e4d5c;">Welcome, ${name}! 🎉</h2>
                <p style="color:#555;">Your account is verified. Start exploring venues in Bangalore.</p>
                <a href="${process.env.CLIENT_URL}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#1e4d5c;color:white;border-radius:50px;text-decoration:none;font-weight:700;">Browse Venues →</a>
            </div>`,
    });
};

/* ══════════════════════════════════════
   BOOKING APPROVED EMAIL
   Sent to booker when owner approves
══════════════════════════════════════ */
const sendBookingApprovedEmail = async (email, name, details) => {
    const deadlineStr = new Date(details.deadline).toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    });
    const eventDateStr = new Date(details.eventDate).toLocaleDateString('en-IN', {
        dateStyle: 'long', timeZone: 'Asia/Kolkata',
    });

    await transporter.sendMail({
        from:    `"BookYourEvent" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `✅ Your bid was approved — ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f6f2;border-radius:16px;">
                <h2 style="color:#16a34a;">🎉 Great news, ${name}!</h2>
                <p style="color:#555;">Your booking request has been <strong>approved</strong> by the venue owner.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2d9c8;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${eventDateStr}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} – ${details.endTime}</p>
                    <p style="margin:0;"><strong>Your Bid:</strong> ₹${details.bidAmount?.toLocaleString('en-IN')}</p>
                </div>

                <div style="background:#fef9ec;border:1px solid #f0c040;border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="margin:0;color:#b45309;font-weight:700;">⏰ Payment Deadline: ${deadlineStr}</p>
                    <p style="margin:6px 0 0;color:#92400e;font-size:13px;">You have 4 hours to complete payment. After this, the slot will be reopened to other bidders.</p>
                </div>

                <a href="${process.env.CLIENT_URL}/booker/my-bookings"
                    style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C8A45B,#E3C67A);color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Pay Now →
                </a>

                <p style="color:#aaa;font-size:12px;margin-top:24px;">BookYourEvent · Bangalore's Premier Venue Platform</p>
            </div>`,
    });
};

/* ══════════════════════════════════════
   PAYMENT REMINDER EMAIL
   Sent 1hr before deadline
══════════════════════════════════════ */
const sendPaymentReminderEmail = async (email, name, details) => {
    const deadlineStr = new Date(details.deadline).toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata',
    });

    await transporter.sendMail({
        from:    `"BookYourEvent" <${process.env.EMAIL_USER}>`,
        to:      email,
        subject: `⚠️ 1 Hour Left to Pay — ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff8f0;border-radius:16px;border:2px solid #f0c040;">
                <h2 style="color:#b45309;">⚠️ Reminder, ${name}!</h2>
                <p style="color:#555;">You have <strong>only 1 hour left</strong> to complete payment for your approved booking.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2d9c8;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Bid Amount:</strong> ₹${details.bidAmount?.toLocaleString('en-IN')}</p>
                    <p style="margin:0;color:#dc2626;font-weight:700;">Deadline: ${deadlineStr}</p>
                </div>

                <p style="color:#dc2626;font-size:13px;">If payment is not completed by the deadline, your slot will be reopened to other bidders.</p>

                <a href="${process.env.CLIENT_URL}/booker/my-bookings"
                    style="display:inline-block;padding:14px 32px;background:#dc2626;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Pay Now — Time is Running Out →
                </a>

                <p style="color:#aaa;font-size:12px;margin-top:24px;">BookYourEvent · Bangalore's Premier Venue Platform</p>
            </div>`,
    });
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendBookingApprovedEmail,
    sendPaymentReminderEmail,
};
