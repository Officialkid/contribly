// For MVP, use console logging. Upgrade to real email service in production
// import nodemailer from 'nodemailer';
const transporter = null;

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
