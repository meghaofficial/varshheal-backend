// For uploading multiple product/variant images:

const cloudinary = require("../config/cloudinary");

const uploadMultiple = async (req, res, next) => {
  try {
    if (!req.files || req.files.length === 0) return next();

    req.uploadedImages = [];

    const uploads = req.files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            { folder: req.folderName },
            (err, result) => {
              if (err) return reject(err);
              resolve({
                url: result.secure_url,
                public_id: result.public_id
              });
            }
          );
          upload.end(file.buffer);
        })
    );

    req.uploadedImages = await Promise.all(uploads);

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = uploadMultiple;
