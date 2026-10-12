const express = require("express");
require("dotenv").config();
const clientRouter = require("./routes/client/index.router");
const adminRouter = require("./routes/admin/index.router");
const database = require("./config/database");
const app = express();
const port = process.env.PORT;

// connect database
// initData.initTables();
database.connect();

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
