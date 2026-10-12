// [GET] /services - Trang danh sách dịch vụ
module.exports.index = (req, res) => {
  const services = [
    {
      title: "Tắm & Cắt tỉa lông",
      price: "150.000đ",
      description:
        "Dịch vụ làm sạch lông, cắt tỉa gọn gàng và thơm tho cho thú cưng.",
    },
    {
      title: "Khám sức khỏe tổng quát",
      price: "200.000đ",
      description: "Kiểm tra sức khỏe định kỳ bởi đội ngũ bác sĩ thú y.",
    },
  ];

  res.render("client/pages/home/services", {
    pageTitle: "Danh Sách Dịch Vụ",
    services: services,
  });
};

// [GET] /services/booking - Trang đặt lịch dịch vụ
module.exports.booking = (req, res) => {
  res.render("client/pages/home/rooms", {
    pageTitle: "Đặt Lịch Dịch Vụ",
  });
};
