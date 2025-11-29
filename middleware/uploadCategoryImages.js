const cloudinary = require("../config/cloudinary");

const uploadCategoryImages = async (req, res, next) => {
  try {
    if (!req.files) return next();

    req.uploadedImages = {};

    const entries = Object.entries(req.files);

    for (const [fieldName, files] of entries) {
      const file = files[0];

      const uploadPromise = () =>
        new Promise((resolve, reject) => {
          const upload = cloudinary.uploader.upload_stream(
            { folder: `${req.folderName}/${fieldName}` },
            (err, result) => {
              if (err) return reject(err);
              resolve({
                url: result.secure_url,
                public_id: result.public_id,
              });
            }
          );
          upload.end(file.buffer);
        });

      req.uploadedImages[fieldName] = await uploadPromise();
    }

    next();
  } catch (err) {
    next(err);
  }
};

module.exports = uploadCategoryImages;
