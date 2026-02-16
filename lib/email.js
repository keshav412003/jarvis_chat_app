import nodemailer from 'nodemailer';

export const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendEmail = async ({ to, subject, html }) => {
    // Dev Mode Fallback
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        if (process.env.NODE_ENV !== 'production') {
            console.log("====================================================");
            console.log("EMAIL SIMULATION (Missing Credentials in Dev Mode)");
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html}`);
            console.log("====================================================");
            return { messageId: 'simulated-dev-email' };
        } else {
            console.error("CRITICAL: Missing Email Credentials in Production");
            throw new Error("Email service not configured");
        }
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.EMAIL_FROM || '"Jarvis Chat" <no-reply@jarvischat.com>',
            to,
            subject,
            html,
        });
        console.log("Message sent: %s", info.messageId);
        return info;
    } catch (error) {
        console.error("Error sending email: ", error);
        throw error;
    }
};
