export const Verification_Email_Template = `
      <!DOCTYPE html>
      <html>
      <head>
      <meta charset="UTF-8" />
      <title>Email Verification</title>
      <style>
            body {
            font-family: Arial, sans-serif;
            background-color: #f6f6f9;
            margin: 0;
            padding: 0;
            }
            .container {
            max-width: 500px;
            margin: 40px auto;
            background: #E6DED3;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            }
            .logo {
            margin-bottom: 20px;
            }
            .title {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 15px;
            color: #111;
            }
            .message {
            font-size: 14px;
            color: #444;
            margin-bottom: 25px;
            line-height: 1.5;
            }
            .code-box {
            background: #f2f2f2;
            padding: 15px;
            font-size: 28px;
            font-weight: bold;
            letter-spacing: 2px;
            border-radius: 6px;
            margin-bottom: 20px;
            }
            .note {
            font-size: 12px;
            color: #777;
            line-height: 1.4;
            margin-bottom: 25px;
            }
            .footer {
            font-size: 12px;
            color: #969798;
            border-top: 1px solid gray;
            padding-top: 15px;
            }
            .socials {
                  margin-top: 10px;
            }
            .socials img {
            width: 20px;
            margin: 0 6px;
            opacity: 0.7;
            }
      </style>
      </head>
      <body>
      <div class="container">
            <!-- Logo -->
            <div class="logo">
            <img src="../assets/logo.png" alt="Company Logo" />
            </div>

            <!-- Title -->
            <div class="title">Verify your vaRshheal sign-up</div>

            <!-- Message -->
            <div class="message">
            Here's your verification code for Signup. Please use this code for Signing Up your account.
            </div>

            <!-- Code -->
            <div class="code-box">{verificationCode}</div>

            <!-- Note -->
            <div class="note">
            If you did not attempt to sign up but received this email, please disregard it.
            The code will remain active for 1 minute.
            </div>

            <!-- Footer -->
            <div class="footer">
            vaRshheal, an effortless identity solution with all the features you need.
            <div class="socials">
            <a href="#"><img src="../assets/whatsapp_icon.png" alt="Whatsapp"></a>
            <a href="#"><img src="../assets/gmail_icon.png" alt="Gmail"></a>
            <a href="#"><img src="../assets/instagram_icon.png" alt="Instagram"></a>
            </div>
            <p>© 2025 vaRshheal. All rights reserved.</p>
            </div>
      </div>
      </body>
      </html>
`;
