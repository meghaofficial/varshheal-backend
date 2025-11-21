const cloudinary = require("../config/cloudinary");

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

const deleteCloudinaryImage = async (url, folder) => {
  if (!url || !url.includes("cloudinary")) return;

  try {
    const publicId = url.split("/").pop().split(".")[0];
    await cloudinary.uploader.destroy(`${folder}/${publicId}`);
  } catch (err) {
    console.warn(`⚠ Failed to delete Cloudinary image: ${err.message}`);
  }
};

module.exports = {
  generateOTP,
  deleteCloudinaryImage
};
