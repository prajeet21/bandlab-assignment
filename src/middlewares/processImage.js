const sharp = require("sharp");

// Middleware function to resize the image to 600 x 600 and convert it to jpg format
const processImage = async (req, res, next) => {
  if (req.file) {
    try {
      const processedImage = await sharp(req.file.buffer)
        .resize(600, 600)
        .toFormat("jpeg")
        .jpeg({
          quality: 100,
          force: true,
        })
        .toBuffer();

      req.file.buffer = processedImage;
      next();
    } catch (error) {
      return res.status(500).json({ error: "Failed to process image" });
    }
  } else {
    next();
  }
};

module.exports = processImage;
