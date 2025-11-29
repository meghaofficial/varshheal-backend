// For uploading single file to cloudinary:

const cloudinary = require("../config/cloudinary");

const uploadSingle = async (req, res, next) => {
  try {
    if (!req.file) return next();

    const result = await cloudinary.uploader.upload_stream(
      { folder: req.folderName },
      (error, result) => {
        if (error) return next(error);
        req.uploadedImage = {
          url: result.secure_url,
          public_id: result.public_id
        };
        next();
      }
    );

    result.end(req.file.buffer);

  } catch (err) {
    next(err);
  }
};

module.exports = uploadSingle;
