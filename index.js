require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser");
const expressSession = require("express-session");
const flash = require("connect-flash");
const clientRouter = require("./routes/client/index.router");
const adminRouter = require("./routes/admin/index.router");
const mongodb = require("./config/mongodb");
const initData = require("./models/initData.model");
const { keycloak, memoryStore } = require("./config/keycloak");
const authMiddleware = require("./middleware/auth.middleware");

const app = express();
const port = Number(process.env.PORT) || 3000;
const sessionSecret = process.env.SESSION_SECRET;

if (!sessionSecret) {
  throw new Error("Cần khai báo SESSION_SECRET trong file .env");
}

app.set("views", "./views");
app.set("view engine", "pug");
app.use(express.static(__dirname + "/public"));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser(process.env.COOKIE_SECRET || sessionSecret));

app.use(
  expressSession({
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: memoryStore,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 1000 * 60 * 60 * 24,
    },
  }),
);

app.use(keycloak.middleware());
app.use(flash());
app.use(authMiddleware.attachSessionUser);

clientRouter(app);
adminRouter(app);

async function startServer() {
  await initData.initTables();
  await mongodb.connect();
  app.listen(port, () => {
    console.log("PetCare đang chạy tại cổng " + port);
  });
}

startServer().catch((error) => {
  console.error("Không thể khởi động PetCare:", error);
  process.exit(1);
});
