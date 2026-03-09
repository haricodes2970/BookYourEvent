const nodemailer = require('nodemailer');

let cachedTransporter = null;
let cachedTransportKey = '';

const safeDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date;
};

const formatDateIN = (value) => {
    const date = safeDate(value);
    if (!date) return 'N/A';
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Asia/Kolkata',
    });
};

const formatDateTimeIN = (value) => {
    const date = safeDate(value);
    if (!date) return 'N/A';
    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Kolkata',
    });
};

const formatINR = (amount) => {
    if (typeof amount !== 'number') return 'N/A';
    return amount.toLocaleString('en-IN');
};

const getTransportOptions = () => {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        throw new Error('Email credentials are missing. Set EMAIL_USER and EMAIL_PASS.');
    }

    if (process.env.SMTP_HOST) {
        const smtpPort = Number(process.env.SMTP_PORT || 587);
        return {
            host: process.env.SMTP_HOST,
            port: smtpPort,
            secure: process.env.SMTP_SECURE === 'true' || smtpPort === 465,
            auth: { user, pass },
        };
    }

    return {
        service: process.env.EMAIL_SERVICE || 'gmail',
        auth: { user, pass },
    };
};

const getTransportKey = () => [
    process.env.EMAIL_USER || '',
    process.env.EMAIL_PASS || '',
    process.env.SMTP_HOST || '',
    process.env.SMTP_PORT || '',
    process.env.SMTP_SECURE || '',
    process.env.EMAIL_SERVICE || 'gmail',
].join('|');

const getTransporter = () => {
    const nextKey = getTransportKey();
    if (cachedTransporter && cachedTransportKey === nextKey) {
        return cachedTransporter;
    }

    cachedTransporter = nodemailer.createTransport(getTransportOptions());
    cachedTransportKey = nextKey;

    cachedTransporter.verify()
        .then(() => {
            console.log('[email] Transport verified successfully');
        })
        .catch((err) => {
            console.error('[email] Transport verification failed:', err.message);
        });

    return cachedTransporter;
};

const sendEmail = async ({ to, subject, html }) => {
    if (!to) {
        throw new Error('Recipient email is missing.');
    }

    const fromAddress = process.env.EMAIL_FROM || `"BookYourEvent" <${process.env.EMAIL_USER}>`;
    const transporter = getTransporter();

    try {
        await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
        });
    } catch (err) {
        throw new Error(`Failed to send email to ${to}: ${err.message}`);
    }
};

const sendOTPEmail = async (email, name, otp) => {
    await sendEmail({
        to: email,
        subject: 'Your OTP - BookYourEvent',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8f6f2;border-radius:16px;">
                <h2 style="color:#1e4d5c;">Hi ${name},</h2>
                <p style="color:#555;">Your OTP to verify your BookYourEvent account:</p>
                <div style="font-size:36px;font-weight:900;letter-spacing:10px;color:#C8A45B;margin:24px 0;">${otp}</div>
                <p style="color:#888;font-size:13px;">Valid for 10 minutes. Do not share this code with anyone.</p>
            </div>`,
    });
};

const sendWelcomeEmail = async (email, name) => {
    await sendEmail({
        to: email,
        subject: 'Welcome to BookYourEvent',
        html: `
            <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px;background:#f8f6f2;border-radius:16px;">
                <h2 style="color:#1e4d5c;">Welcome, ${name}</h2>
                <p style="color:#555;">Your account is verified. Start exploring venues now.</p>
                <a href="${process.env.CLIENT_URL || '#'}" style="display:inline-block;margin-top:16px;padding:12px 28px;background:#1e4d5c;color:white;border-radius:50px;text-decoration:none;font-weight:700;">Browse Venues</a>
            </div>`,
    });
};

const sendBookingApprovedEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Booking approved - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f8f6f2;border-radius:16px;">
                <h2 style="color:#16a34a;">Booking approved, ${name}</h2>
                <p style="color:#555;">Your booking request has been approved by the venue owner.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2d9c8;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0;"><strong>Your Bid:</strong> INR ${formatINR(details.bidAmount)}</p>
                </div>

                <div style="background:#fef9ec;border:1px solid #f0c040;border-radius:12px;padding:16px;margin-bottom:24px;">
                    <p style="margin:0;color:#b45309;font-weight:700;">Payment deadline: ${formatDateTimeIN(details.deadline)}</p>
                    <p style="margin:6px 0 0;color:#92400e;font-size:13px;">Complete payment within 4 hours, otherwise the slot will be reopened.</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}/booker/my-bookings"
                    style="display:inline-block;padding:14px 32px;background:linear-gradient(135deg,#C8A45B,#E3C67A);color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Complete Payment
                </a>
            </div>`,
    });
};

const sendPaymentReminderEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Payment reminder - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff8f0;border-radius:16px;border:2px solid #f0c040;">
                <h2 style="color:#b45309;">Reminder, ${name}</h2>
                <p style="color:#555;">You have less than 1 hour left to complete payment for your approved booking.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #e2d9c8;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Bid Amount:</strong> INR ${formatINR(details.bidAmount)}</p>
                    <p style="margin:0;color:#dc2626;font-weight:700;">Deadline: ${formatDateTimeIN(details.deadline)}</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}/booker/my-bookings"
                    style="display:inline-block;padding:14px 32px;background:#dc2626;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Pay Now
                </a>
            </div>`,
    });
};

const sendBookerPaymentSuccessEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Payment received - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f0fdf4;border-radius:16px;border:1px solid #bbf7d0;">
                <h2 style="color:#166534;">Payment successful, ${name}</h2>
                <p style="color:#555;">Your booking is now confirmed.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #d1fae5;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0 0 8px;"><strong>Paid:</strong> INR ${formatINR(details.bidAmount)}</p>
                    <p style="margin:0;"><strong>Payment ID:</strong> ${details.paymentId || 'N/A'}</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}/booker/my-bookings"
                    style="display:inline-block;padding:14px 32px;background:#166534;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    View Booking
                </a>
            </div>`,
    });
};

const sendOwnerPaymentReceivedEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Booking paid - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#eef2ff;border-radius:16px;border:1px solid #c7d2fe;">
                <h2 style="color:#1d4ed8;">Payment received, ${name}</h2>
                <p style="color:#555;">A booker has completed payment for an approved booking.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #dbeafe;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Event Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0 0 8px;"><strong>Booked By:</strong> ${details.bookerName || 'N/A'} (${details.bookerEmail || 'N/A'})</p>
                    <p style="margin:0 0 8px;"><strong>Total Paid:</strong> INR ${formatINR(details.bidAmount)}</p>
                    <p style="margin:0 0 8px;"><strong>Your Payout:</strong> INR ${formatINR(details.ownerAmount)}</p>
                    <p style="margin:0;"><strong>Platform Fee:</strong> INR ${formatINR(details.platformFee)}</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}/owner/dashboard"
                    style="display:inline-block;padding:14px 32px;background:#1d4ed8;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Open Dashboard
                </a>
            </div>`,
    });
};

const sendBookingRejectedEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Booking update - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fff7ed;border-radius:16px;border:1px solid #fed7aa;">
                <h2 style="color:#c2410c;">Booking not approved, ${name}</h2>
                <p style="color:#555;">Your bid was not selected for this slot.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #fdba74;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0;"><strong>Your Bid:</strong> INR ${formatINR(details.bidAmount)}</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}"
                    style="display:inline-block;padding:14px 32px;background:#c2410c;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Explore Other Venues
                </a>
            </div>`,
    });
};

const sendBookingExpiredEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Booking expired - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#fef2f2;border-radius:16px;border:1px solid #fecaca;">
                <h2 style="color:#b91c1c;">Booking expired, ${name}</h2>
                <p style="color:#555;">The payment window closed, so this booking has expired and the slot is now reopened.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #fca5a5;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0;"><strong>Bid Amount:</strong> INR ${formatINR(details.bidAmount)}</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}"
                    style="display:inline-block;padding:14px 32px;background:#b91c1c;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Book Again
                </a>
            </div>`,
    });
};

const sendOwnerNewBidEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `New bid received - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#eff6ff;border-radius:16px;border:1px solid #bfdbfe;">
                <h2 style="color:#1d4ed8;">New booking bid, ${name}</h2>
                <p style="color:#555;">A new bid has been placed on your venue.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #dbeafe;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Event Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0 0 8px;"><strong>Bid Amount:</strong> INR ${formatINR(details.bidAmount)}</p>
                    <p style="margin:0;"><strong>Booker:</strong> ${details.bookerName || 'N/A'} (${details.bookerEmail || 'N/A'})</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}/owner/dashboard"
                    style="display:inline-block;padding:14px 32px;background:#1d4ed8;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Review Bids
                </a>
            </div>`,
    });
};

const sendOwnerBidRaisedEmail = async (email, name, details) => {
    await sendEmail({
        to: email,
        subject: `Bid updated - ${details.venueName}`,
        html: `
            <div style="font-family:sans-serif;max-width:520px;margin:auto;padding:32px;background:#f0f9ff;border-radius:16px;border:1px solid #bae6fd;">
                <h2 style="color:#0369a1;">Bid raised, ${name}</h2>
                <p style="color:#555;">A booker has increased their bid for your venue slot.</p>

                <div style="background:white;border-radius:12px;padding:20px;margin:20px 0;border:1px solid #bae6fd;">
                    <p style="margin:0 0 8px;"><strong>Venue:</strong> ${details.venueName}</p>
                    <p style="margin:0 0 8px;"><strong>Event Date:</strong> ${formatDateIN(details.eventDate)}</p>
                    <p style="margin:0 0 8px;"><strong>Time:</strong> ${details.startTime} - ${details.endTime}</p>
                    <p style="margin:0 0 8px;"><strong>New Bid:</strong> INR ${formatINR(details.bidAmount)}</p>
                    <p style="margin:0;"><strong>Booker:</strong> ${details.bookerName || 'N/A'} (${details.bookerEmail || 'N/A'})</p>
                </div>

                <a href="${process.env.CLIENT_URL || '#'}/owner/dashboard"
                    style="display:inline-block;padding:14px 32px;background:#0369a1;color:white;border-radius:50px;text-decoration:none;font-weight:700;font-size:15px;">
                    Check Slot
                </a>
            </div>`,
    });
};

module.exports = {
    sendOTPEmail,
    sendWelcomeEmail,
    sendBookingApprovedEmail,
    sendBookingRejectedEmail,
    sendBookingExpiredEmail,
    sendPaymentReminderEmail,
    sendOwnerNewBidEmail,
    sendOwnerBidRaisedEmail,
    sendBookerPaymentSuccessEmail,
    sendOwnerPaymentReceivedEmail,
};

