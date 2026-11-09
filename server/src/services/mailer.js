import nodemailer from 'nodemailer';
import env from '../config/env.js';
import logger from '../utils/logger.js';

const isConfigured = Boolean(env.SMTP_HOST && env.SMTP_USER && env.SMTP_PASS);

let transporter = null;
if (isConfigured) {
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    },
  });
}

export const mailerService = {
  /**
   * Send an email notification (or log in development if SMTP is unconfigured)
   */
  async sendEmail({ to, subject, text, html }) {
    if (!to) return false;

    if (!isConfigured) {
      logger.info(
        { to, subject, preview: text?.slice(0, 80) },
        'SMTP unconfigured; mock email notification logged'
      );
      return { success: true, mock: true };
    }

    try {
      const info = await transporter.sendMail({
        from: env.EMAIL_FROM,
        to,
        subject,
        text,
        html: html || `<p>${text}</p>`,
      });
      logger.info({ to, messageId: info.messageId }, 'Email notification sent successfully');
      return { success: true, messageId: info.messageId };
    } catch (err) {
      logger.error({ err: err.message, to, subject }, 'Failed to send email notification');
      return { success: false, error: err.message };
    }
  },

  /**
   * Send formatted status update email to citizen
   */
  async sendStatusUpdateEmail({ to, userName, complaintNo, title, fromStatus, toStatus, note }) {
    const formattedToStatus = toStatus.replace('_', ' ').toUpperCase();
    const subject = `[CivicEye] Status Update: ${complaintNo} is now ${formattedToStatus}`;

    const text = `
Hello ${userName || 'Citizen'},

Your reported civic problem "${title}" (Reference: ${complaintNo}) has been updated.

Status: ${formattedToStatus}
${fromStatus ? `Previous Status: ${fromStatus.replace('_', ' ')}\n` : ''}
${note ? `Notes: ${note}\n` : ''}

You can track real-time resolution progress on CivicEye.

Thank you for helping keep our city clean and safe!
— The CivicEye Team
    `.trim();

    const html = `
      <div style="font-family: sans-serif; line-height: 1.5; color: #1e293b; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 12px;">
        <h2 style="color: #2563eb; margin-bottom: 4px;">CivicEye Status Update</h2>
        <p style="font-size: 14px; color: #64748b; margin-top: 0;">Reference: <strong>${complaintNo}</strong></p>
        
        <p>Hello <strong>${userName || 'Citizen'}</strong>,</p>
        <p>Your reported issue "<strong>${title}</strong>" has progressed to a new status:</p>
        
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border-left: 4px solid #2563eb; margin: 20px 0;">
          <p style="margin: 0; font-size: 16px;">New Status: <strong style="color: #2563eb;">${formattedToStatus}</strong></p>
          ${note ? `<p style="margin: 8px 0 0 0; font-size: 13px; color: #475569;">Note: ${note}</p>` : ''}
        </div>
        
        <p style="font-size: 13px; color: #64748b;">Thank you for active citizen participation.</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p style="font-size: 11px; color: #94a3b8;">CivicEye Smart City Reporting Platform</p>
      </div>
    `;

    return this.sendEmail({ to, subject, text, html });
  },
};

export default mailerService;

