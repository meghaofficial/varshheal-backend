const nodemailer = require("nodemailer");
const { Verification_Email_Template, Welcome_Email_Template } = require("./emailTemplate");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // true for port 465, false for other ports
  auth: {
    user: "varshheal23@gmail.com",
    pass: "ybws gfpx hazb wqyu",
  },
});

// Generic email sender with dynamic placeholders
const sendEmail = async (email, { template, subject, data }) => {
  try {
    let html = template;
    for (const key in data) {
      const regex = new RegExp(`{${key}}`, "g");
      html = html.replace(regex, data[key]);
    }

    const response = await transporter.sendMail({
      from: '"Varshheal" <varshheal23@gmail.com>',
      to: email,
      subject,
      text: "Please check the details",
      html,
    });

    console.log("Email sent successfully", response);
  } catch (error) {
    console.error("Email sending failed:", error);
  }
};

// Verification email
const sendVerificationCode = (email, verification) => {
  return sendEmail(email, {
    template: Verification_Email_Template,
    subject: "Email Verification",
    data: { verificationCode: verification },
  });
};

// Password reset email
const sendPasswordReset = (email, name, link) => {
  return sendEmail(email, {
    template: Password_Reset_Template,
    subject: "Reset Your Password",
    data: { name, link },
  });
};

// Example: Welcome email
const sendWelcomeEmail = (email, name) => {
  return sendEmail(email, {
    template: Welcome_Email_Template,
    subject: "Welcome to Varshheal 🎉",
    data: { name },
  });
};

module.exports = {
      sendVerificationCode,
      sendWelcomeEmail
}