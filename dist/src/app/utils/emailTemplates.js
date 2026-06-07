export const getOtpEmailTemplate = (fullName, otp, type) => {
    const badgeText = type === 'register' ? '🔒 Registration Verification' : '🔑 OTP Verification';
    const actionText = type === 'register'
        ? 'a registration attempt was made to create your ZawajBD account'
        : 'a request was made to access or verify your ZawajBD account';
    const warningText = type === 'register'
        ? "Didn't try to sign up? If this wasn't you, you can safely ignore this email. No account will be created without this verification code."
        : "Didn't request this verification code? If this wasn't you, your account may be secure but please make sure you don't share this code with anyone.";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Account</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f6f5f7; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f6f5f7; padding: 30px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card -->
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 500px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); border: 1px solid #e1e0e3;">
          
          <!-- Header Banner -->
          <tr>
            <td align="center" style="background: linear-gradient(135deg, #0d0714 0%, #1a0f29 100%); padding: 30px; border-bottom: 3px solid #c5a059;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <span style="font-family: Georgia, serif; font-size: 26px; font-weight: 900; color: #ffffff; letter-spacing: 2px; text-transform: uppercase;">
                      ZAWAJ<span style="color: #c5a059;">BD</span>
                    </span>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top: 5px;">
                    <span style="font-size: 10px; color: rgba(255, 255, 255, 0.6); letter-spacing: 3px; font-weight: bold; text-transform: uppercase;">
                      Premium Matrimony
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 40px 30px; text-align: left;">
              
              <!-- Badge -->
              <table border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 20px;">
                <tr>
                  <td style="background-color: #fdf6e7; border: 1px solid #f2e3c6; border-radius: 20px; padding: 6px 14px; font-size: 12px; font-weight: bold; color: #b4852c; font-family: sans-serif;">
                    ${badgeText}
                  </td>
                </tr>
              </table>

              <!-- Greeting -->
              <h2 style="font-size: 22px; font-weight: 800; color: #0d0714; margin: 0 0 16px 0; font-family: sans-serif;">
                Verify it's you
              </h2>
              
              <p style="font-size: 14px; color: #555555; line-height: 1.6; margin: 0 0 25px 0; font-family: sans-serif;">
                Hi <strong style="color: #0d0714;">${fullName}</strong>, ${actionText}. Use the code below to complete the verification step.
              </p>

              <!-- Verification Code Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #fdfbf7; border: 1px dashed #ead4aa; border-radius: 8px; margin-bottom: 15px;">
                <tr>
                  <td align="center" style="padding: 24px 10px;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 38px; font-weight: bold; letter-spacing: 8px; color: #b4852c;">
                      ${otp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiry Badge -->
              <table align="center" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 30px;">
                <tr>
                  <td align="center" style="background-color: #fdfdfd; border: 1px solid #ffd899; border-radius: 20px; padding: 4px 12px; font-size: 11px; font-weight: bold; color: #b27a1c; font-family: sans-serif;">
                    ⏳ Expires in 10 minutes
                  </td>
                </tr>
              </table>

              <!-- Warning Callout -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-left: 3px solid #c5a059; background-color: #fdfbf6; margin-bottom: 10px; border-radius: 0 4px 4px 0;">
                <tr>
                  <td style="padding: 15px; font-size: 13px; color: #7c622d; line-height: 1.5; font-family: sans-serif;">
                    <strong>Security Alert:</strong> ${warningText}
                  </td>
                </tr>
              </table>

              <p style="font-size: 12px; color: #888888; line-height: 1.5; margin: 20px 0 0 0; font-family: sans-serif; text-align: center;">
                Never share this code with anyone. ZawajBD staff will never ask for your verification code.
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background-color: #fafafa; padding: 30px; border-top: 1px solid #eeeeee; font-size: 12px; color: #999999;">
              <p style="margin: 0 0 10px 0; font-family: sans-serif;">
                Sent by the <strong style="color: #0d0714;">ZawajBD</strong> team
              </p>
              <p style="margin: 0 0 15px 0; font-family: sans-serif;">
                <a href="https://zawajbd.com" target="_blank" style="color: #b4852c; text-decoration: none; font-weight: bold;">www.zawajbd.com</a>
              </p>
              <p style="margin: 0; font-size: 11px; font-family: sans-serif; color: #b5b5b5;">
                &copy; 2026 ZawajBD. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
//# sourceMappingURL=emailTemplates.js.map