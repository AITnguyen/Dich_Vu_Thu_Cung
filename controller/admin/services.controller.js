module.exports.index = async (req, res) => {
  try {
    const services = [
      {
        id: "1",
        title: "Tắm và cắt tỉa lông",
        price: "150,000đ",
        description:
          "Dịch vụ tắm gội, sấy khô và tạo kiểu tóc cơ bản cho thú cưng.",
      },
      {
        id: "2",
        title: "Khám sức khỏe tổng quát",
        price: "200,000đ",
        description: "Kiểm tra tim mạch, hô hấp và tư vấn dinh dưỡng định kỳ.",
      },
      {
        id: "3",
        title: "Tiêm phòng vaccine",
        price: "300,000đ",
        description: "Tiêm phòng các bệnh truyền nhiễm nguy hiểm cho chó mèo.",
      },
    ];

    res.render("admin/pages/services/index", {
      pageTitle: "Quản lý Dịch vụ",
      path: "/services",
      services: services,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/admin/dashboard");
  }
};
