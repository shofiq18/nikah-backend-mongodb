import nodemailer from 'nodemailer';
import config from '../../config/index.js';

export const sendEmail = async (to: string, html: string) => {
  const transporter = nodemailer.createTransport({
    host: config.email_host as string,
    port: Number(config.email_port),
    secure: config.node_env === 'production' && config.email_port === '465',
    auth: {
      user: config.email_user as string,
      pass: config.email_pass as string,
    },
  });

  await transporter.sendMail({
    from: '"NikahBD" <noreply@nikahbd.com>', // sender address
    to, // list of receivers
    subject: 'Verification OTP for NikahBD', // Subject line
    text: 'Please verify your email using the OTP provided.', // plain text body
    html, // html body
  });
};
