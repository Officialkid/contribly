import nodemailer from "nodemailer";

// Create reusable transporter
const transporter = process.env.SMTP_HOST ? nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}) : null;

export async function sendOTPEmail(email: string, otp: string): Promise<boolean> {
  try {
    // For MVP, just log to console
    console.log(`[OTP EMAIL] To: ${email}, Code: ${otp}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}

export async function sendWithdrawalApprovedEmail(
  email: string,
  amount: number,
  reason: string
): Promise<boolean> {
  try {
    // For MVP, just log to console
    console.log(`[WITHDRAWAL APPROVED] To: ${email}, Amount: ${amount}, Reason: ${reason}`);
    return true;
  } catch (error) {
    console.error("Failed to send withdrawal approved email:", error);
    return false;
  }
}

export async function sendInviteEmail(
  email: string,
  inviteCode: string,
  inviteUrl: string
): Promise<boolean> {
  try {
    // For MVP, just log to console
    console.log(`[INVITE EMAIL] To: ${email}, Code: ${inviteCode}, URL: ${inviteUrl}`);
    return true;
  } catch (error) {
    console.error("Failed to send invite email:", error);
    return false;
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  userName?: string
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

  if (!transporter) {
    console.log(`[PASSWORD RESET EMAIL] To: ${to}, Link: ${resetLink}`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Contribly" <noreply@contribly.com>',
    to,
    subject: "Reset Your Contribly Password",
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700;">Contribly</h1>
              <p style="color: rgba(255, 255, 255, 0.9); margin: 10px 0 0 0; font-size: 16px;">Contribution Management</p>
            </div>
            <div style="padding: 40px 30px;">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">Reset Your Password</h2>
              <p style="font-size: 16px; margin: 0 0 20px 0; color: #555;">Hi${userName ? ` <strong>${userName}</strong>` : ""},</p>
              <p style="font-size: 16px; margin: 0 0 25px 0; color: #555;">We received a request to reset your password. Click the button below:</p>
              <div style="text-align: center; margin: 35px 0;">
                <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(102, 126, 234, 0.4);">Reset Password</a>
              </div>
              <p style="font-size: 14px; color: #666; margin: 25px 0; text-align: center;">Or copy this link:</p>
              <div style="background: #f7f7f7; border: 1px solid #e0e0e0; border-radius: 6px; padding: 15px; word-break: break-all; font-family: monospace; font-size: 13px; color: #555;">${resetLink}</div>
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 16px 20px; margin: 30px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️ This link expires in 1 hour</strong></p>
                <p style="margin: 5px 0 0 0; font-size: 13px; color: #856404;">For security, this link only works once.</p>
              </div>
              <div style="background: #e7f3ff; border-left: 4px solid #2196F3; padding: 16px 20px; margin: 20px 0; border-radius: 6px;">
                <p style="margin: 0; font-size: 14px; color: #1565C0;"><strong>🔒 Security:</strong> If you didn't request this, ignore this email. Your password stays unchanged.</p>
              </div>
            </div>
            <div style="background: #f7f7f7; padding: 20px 30px; text-align: center; border-top: 1px solid #e0e0e0;">
              <p style="margin: 0; font-size: 12px; color: #999;">© ${new Date().getFullYear()} Contribly. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
    text: `Hi${userName ? ` ${userName}` : ""},

We received a request to reset your password for your Contribly account.

Reset your password: ${resetLink}

⚠️ This link expires in 1 hour and only works once.

If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} Contribly`,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ Password reset email sent to ${to}`);
}

/**
 * Send MFA verification code email
 */
export async function sendMFACodeEmail(
  to: string,
  code: string,
  userName?: string
): Promise<void> {
  if (!transporter) {
    console.log(`[MFA CODE EMAIL] To: ${to}, Code: ${code}`);
    return;
  }

  const mailOptions = {
    from: process.env.SMTP_FROM || '"Contribly" <noreply@contribly.com>',
    to,
    subject: "Your Contribly Verification Code",
    html: `
      <!DOCTYPE html>
      <html>
        <head><meta charset="utf-8"></head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 28px;">Verification Code</h1>
          </div>
          <div style="background: #f7f7f7; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="font-size: 16px;">Hi${userName ? ` ${userName}` : ""},</p>
            <p style="font-size: 16px;">Your verification code is:</p>
            <div style="text-align: center; margin: 30px 0;">
              <div style="display: inline-block; background: white; padding: 20px 40px; border-radius: 8px; border: 2px dashed #667eea;">
                <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #667eea;">${code}</span>
              </div>
            </div>
            <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
              <p style="margin: 0; font-size: 14px; color: #856404;"><strong>⚠️</strong> This code expires in 10 minutes.</p>
            </div>
            <p style="font-size: 14px; color: #666;">If you didn't request this code, secure your account immediately.</p>
          </div>
        </body>
      </html>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✅ MFA code email sent to ${to}`);
}
