const express = require("express");
require("dotenv").config();
const clientRouter = require("./routes/client/index.router");
const adminRouter = require("./routes/admin/index.router");
const mongodb = require("./config/mongodb");
const initData = require("./models/initData.model");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
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

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser("PETCARE_COOKIE_SECRET"));
app.use(
  expressSession({
    secret: "petcare-session-secret",
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  }),
);

// Route
clientRouter(app);
adminRouter(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
