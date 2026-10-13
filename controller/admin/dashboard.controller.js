module.exports.dashboard = (req, res) => {
  res.render("admin/pages/dashboard/index", {
    pageTitle: "Trang Tổng Quan",
  });
};
