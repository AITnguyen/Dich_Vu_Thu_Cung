const systemConfig = require("../../config/system");
const dashboardRouter = require("./dashboard.router");
const servicesRouter = require("./services.router");
const roomsRouter = require("./rooms.router");

module.exports = (app) => {
  const PATH_ADMIN = systemConfig.prefixAdmin;

  app.use(PATH_ADMIN + "/dashboard", dashboardRouter);
  app.use(PATH_ADMIN + "/services", servicesRouter);
  app.use(PATH_ADMIN + "/rooms", roomsRouter);
};
