const systemConfig = require("../../config/system");
const dashboardRouter = require("./dashboard.router");
const servicesRouter = require("./services.router");
const roomsRouter = require("./rooms.router");
const authRouter = require("./auth.router");
const authMiddleware = require("../../middleware/auth.middleware");

module.exports = (app) => {
  const PATH_ADMIN = systemConfig.prefixAdmin;

  app.use(PATH_ADMIN + "/auth", authRouter);
  app.use(
    PATH_ADMIN + "/dashboard",
    authMiddleware.requireAdmin,
    dashboardRouter,
  );
  app.use(
    PATH_ADMIN + "/services",
    authMiddleware.requireAdmin,
    servicesRouter,
  );
  app.use(PATH_ADMIN + "/rooms", authMiddleware.requireAdmin, roomsRouter);
};
