// Helper function to check if the file extension is allowed
const fileFilter = (req, file, cb) => {
  const allowedExtensions = [".png", ".jpg", ".bmp"];
  const extension = "." + file.originalname.split(".").pop();
  if (allowedExtensions.includes(extension)) {
    cb(null, true); // Accept the file
  } else {
    cb(
      new Error(
        "Invalid file type. Only .png, .jpg, and .bmp files are allowed."
      ),
      false
    );
  }
};

module.exports = {
  fileFilter,
};
