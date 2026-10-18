const systemConfig = require("../../config/system");
const dashboardRouter = require("./dashboard.router");
const servicesRouter = require("./services.router");

module.exports = (app) => {
  const PATH_ADMIN = systemConfig.prefixAdmin;

  app.use(PATH_ADMIN + "/dashboard", dashboardRouter);
  app.use(PATH_ADMIN + "/services", servicesRouter);
};
