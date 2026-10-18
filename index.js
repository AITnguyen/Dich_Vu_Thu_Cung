const express = require("express");
require("dotenv").config();
const clientRouter = require("./routes/client/index.router");
const adminRouter = require("./routes/admin/index.router");
const mongodb = require("./config/mongodb");
const initData = require("./models/initData.model");
const app = express();
const port = process.env.PORT;

// connect database
initData.initTables();
mongodb.connect();

// Pug
app.set("views", "./views");
app.set("view engine", "pug");

// Public
app.use(express.static(`${__dirname}/public`));

// Route
clientRouter(app);
adminRouter(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
