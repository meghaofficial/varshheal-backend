const Verification_Email_Template = `
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

const Welcome_Email_Template = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>Welcome to vaRshheal</title>
      <style>
            body {
            font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f5f3f1;
            margin: 0;
            padding: 0;
            }

            .email-container {
            max-width: 600px;
            margin: 40px auto;
            background: #f9f7f6;
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
            }

            .logo {
            margin-bottom: 20px;
            }

            .logo img {
            width: 80px;
            height: auto;
            }

            h1 {
            color: #000000;
            font-size: 22px;
            margin-bottom: 15px;
            }

            p {
            color: #333333;
            line-height: 1.6;
            font-size: 15px;
            margin: 10px 0;
            }

            .highlight-box {
            background-color: #ffffff;
            border-radius: 6px;
            padding: 20px;
            font-size: 16px;
            color: #111;
            font-weight: 600;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
            margin: 25px 0;
            }

            .button {
            display: inline-block;
            padding: 12px 28px;
            background-color: #123458;
            color: #ffffff;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin-top: 10px;
            }

            .divider {
            height: 1px;
            background: #ccc;
            margin: 30px 0;
            }

            .footer {
            font-size: 13px;
            color: #666;
            }

            .social-links img {
            width: 24px;
            height: 24px;
            margin: 0 6px;
            vertical-align: middle;
            }

            @media (max-width: 600px) {
            .email-container {
            padding: 20px;
            }
            .highlight-box {
            font-size: 15px;
            }
            }
      </style>
      </head>

      <body>
      <div class="email-container">
            <div class="logo">
            <img src="https://via.placeholder.com/80x40?text=Logo" alt="Company Logo" />
            </div>

            <h1>Welcome to vaRshheal!</h1>

            <p>
            We’re thrilled to have you onboard. 🎉<br />
            Your account has been successfully created. Get started by exploring
            everything vaRshheal has to offer.
            </p>

            <div class="highlight-box">
            Access your dashboard, manage your profile, and explore new features —
            all in one place.
            </div>

            <a href="#" class="button">Go to Dashboard</a>

            <div class="divider"></div>

            <p class="footer">
            vaRshheal, an effortless identity solution with all the features you
            need.<br />
            <br />
            <span class="social-links">
            <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/2111/2111728.png" alt="WhatsApp" /></a>
            <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/281/281769.png" alt="Gmail" /></a>
            <a href="#"><img src="https://cdn-icons-png.flaticon.com/512/1384/1384063.png" alt="Instagram" /></a>
            </span>
            <br /><br />
            © 2025 vaRshheal. All rights reserved.
            </p>
      </div>
      </body>
      </html>
`

module.exports = {
      Verification_Email_Template,
      Welcome_Email_Template
}
