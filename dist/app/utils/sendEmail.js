import nodemailer from 'nodemailer';
import config from '../../config/index.js';
export const sendEmail = async (to, html) => {
    const transporter = nodemailer.createTransport({
        host: config.email_host,
        port: Number(config.email_port),
        secure: config.node_env === 'production' && config.email_port === '465',
        auth: {
            user: config.email_user,
            pass: config.email_pass,
        },
    });
    await transporter.sendMail({
        from: '"NikahBD" <noreply@nikahbd.com>',
        to,
        subject: 'Verification OTP for NikahBD',
        text: 'Please verify your email using the OTP provided.',
        html,
    });
};
//# sourceMappingURL=sendEmail.js.map