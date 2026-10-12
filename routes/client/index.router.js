const serviceRouter = require("./service.router");

module.exports = (app) => {
  app.get("/", (req, res) => {
    res.render("client/pages/home/index");
  });

  app.use("/service", serviceRouter);
};
