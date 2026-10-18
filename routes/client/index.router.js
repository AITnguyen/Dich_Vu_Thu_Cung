const homeRouter = require("./home.router");
const servicesRouter = require("./services.router");
const roomsRouter = require("./rooms.router");
const authRouter = require("./auth.router");
const userRouter = require("./user.router")

module.exports = (app) => {
  app.use("/", homeRouter);
  app.use("/services", servicesRouter);
  app.use("/rooms", roomsRouter);
  app.use("/auth", authRouter);
  app.use("/user", userRouter)
};
