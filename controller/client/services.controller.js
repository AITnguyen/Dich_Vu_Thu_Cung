const Service = require("../../models/SERVICES.model");

module.exports.index = async (req, res) => {
  try {
    const services = await Service.getAll();

    res.render("client/pages/services/index", {
      pageTitle: "Danh Sách Dịch Vụ",
      services: services,
    });
  } catch (error) {
    console.error("Lỗi khi tải trang dịch vụ:", error);
    res.redirect("/");
  }
};