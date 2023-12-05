const express = require("express");
const router = express.Router();
const multer = require("multer");
const postsController = require("../controllers/postsController");
const processImage = require("../middlewares/processImage");
const imageFileFilter = require("../utils/imageFileFilter");

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 100000000 }, // 100MB size limit
  fileFilter: imageFileFilter.fileFilter, // call helper function to check if image is allowed
});

router.post(
  "/",
  upload.single("image"),
  processImage,
  postsController.createPost
);
router.post("/:postId/comments", postsController.addComment);
router.delete("/:postId/comments/:commentId", postsController.deleteComment);
router.get("/", postsController.getPosts);

module.exports = router;
