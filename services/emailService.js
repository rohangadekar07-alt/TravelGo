const nodemailer = require('nodemailer');

// ✅ Supports both Brevo (recommended for production) and Gmail
// For Brevo: set SMTP_HOST=smtp-relay.brevo.com, SMTP_PORT=587
// For Gmail: set SMTP_HOST=smtp.gmail.com, SMTP_PORT=465
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_SECURE = SMTP_PORT === 465;

console.log(`📡 Initializing Email Service via ${SMTP_HOST}:${SMTP_PORT} as: ${process.env.EMAIL_USER}`);

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_SECURE,
    family: 4, // Force IPv4 - prevents ENETUNREACH on cloud platforms
    connectionTimeout: 15000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration (non-blocking)
transporter.verify(function (error, success) {
    if (error) {
        console.log('🔴 Email Service Error:', error.message);
        console.log('   → Check EMAIL_USER, EMAIL_PASS, SMTP_HOST, SMTP_PORT in your env settings.');
    } else {
        console.log(`🟢 Email Service ready → ${SMTP_HOST}:${SMTP_PORT} (${process.env.EMAIL_USER})`);
    }
});

const sendVerificationEmail = async (email, token, baseUrl) => {
    const finalBaseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
    const url = `${finalBaseUrl}/api/auth/verify?token=${token}`;
    
    const mailOptions = {
        from: `"TravelGO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Verify Your Email - TravelGO',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #3a86ff; text-align: center;">Welcome to TravelGO!</h2>
                <p>Hello,</p>
                <p>Thank you for registering with TravelGO. To activate your account, please click the button below to verify your email address:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${url}" style="background-color: #3a86ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify Email Address</a>
                </div>
                <p>If the button doesn't work, copy and paste the following link into your browser:</p>
                <p style="word-break: break-all;"><a href="${url}">${url}</a></p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">If you did not create an account, please ignore this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

const sendOtpEmail = async (email, otp) => {
    const mailOptions = {
        from: `"TravelGO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Your Registration OTP - TravelGO',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #3a86ff; text-align: center;">Email Verification</h2>
                <p>Hello,</p>
                <p>Your OTP for registration on TravelGO is:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <h1 style="background: #f4f7fe; color: #3a86ff; padding: 15px; border-radius: 8px; font-size: 32px; letter-spacing: 5px; display: inline-block; margin: 0;">${otp}</h1>
                </div>
                <p>This OTP is valid for 10 minutes. Do not share this OTP with anyone.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

const sendWelcomeEmail = async (email, name, baseUrl) => {
    const finalBaseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
    const loginUrl = `${finalBaseUrl}/login.html`;
    
    const mailOptions = {
        from: `"TravelGO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Welcome to TravelGO! 🎉',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #3a86ff; text-align: center;">Registration Successful!</h2>
                <p>Hello <strong>${name}</strong>,</p>
                <p>Welcome to TravelGO! Your account has been successfully created and verified.</p>
                <p>You can now start planning your dream journey with us.</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${loginUrl}" style="background-color: #3a86ff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold;">Login to Your Account</a>
                </div>
                <p>If you have any questions, feel free to reply to this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #777;">Happy Travels!<br><strong>Team TravelGO</strong></p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

const sendResetOtpEmail = async (email, otp, baseUrl) => {
    const finalBaseUrl = baseUrl || process.env.BASE_URL || 'http://localhost:5000';
    const mailOptions = {
        from: `"TravelGO" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Password Reset OTP - TravelGO',
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 10px;">
                <h2 style="color: #3a86ff; text-align: center;">Reset Your Password</h2>
                <p>Hello,</p>
                <p>Your OTP to reset your TravelGO password is:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <h1 style="background: #f4f7fe; color: #3a86ff; padding: 15px; border-radius: 8px; font-size: 32px; letter-spacing: 5px; display: inline-block; margin: 0;">${otp}</h1>
                </div>
                <p>This OTP is valid for 10 minutes. Do not share this OTP with anyone.</p>
                <p>If you did not request a password reset, please ignore this email.</p>
                <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                <p style="text-align: center; color: #777;">Stay Secure!<br><strong>Team TravelGO</strong></p>
            </div>
        `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = {
    sendVerificationEmail,
    sendOtpEmail,
    sendWelcomeEmail,
    sendResetOtpEmail
};

