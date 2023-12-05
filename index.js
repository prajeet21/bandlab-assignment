const express = require("express");
const bodyParser = require("body-parser");
const postsRoutes = require("./src/routes/postsRoutes");

// Load .env file configurations
require("dotenv").config();

const app = express();

// Middleware for JSON body parsing
app.use(express.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

const port = process.env.PORT || 3000;

// Use routes
app.use("/posts", postsRoutes);

app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
