// Import module
require("dotenv").config();
const port = process.env.PORT | 21575;
const hostname = process.env.HOST | "localhost";
const express = require("express");
const app = express();
const fs = require("fs/promises");

app.use(express.static(__dirname));
app.use(express.urlencoded({ extended: true }));

const customTemplateEngine = require("./21575");
app.engine("html", customTemplateEngine);

app.set("views", "./views");
app.set("view engine", "html");

// Routing
const homeRouter = require("./routers/home.r");
app.use("/", homeRouter);

// Middleware
const middleware = require("./middleware/mdw");
app.use(middleware.middleware);

// Connection
app.listen(port, hostname, () => {
  console.log(`Server is running on http://localhost:${port}/`);
});