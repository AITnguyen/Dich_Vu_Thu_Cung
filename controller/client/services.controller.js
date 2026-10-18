module.exports.index = async (req, res) => {
  try {
    const services = [
      {
        id: "1",
        title: "Combo Tắm & Spa Toàn Diện",
        price: "150.000 VND / lượt",
        category: "Dành cho Chó & Mèo",
        location: "Chi nhánh Ninh Kiều, Cần Thơ",
        thumbnail: "/image/thumbnail.jpg",
      },
      {
        id: "2",
        title: "Cắt Tỉa & Tạo Kiểu Lông",
        price: "250.000 VND / lượt",
        category: "Tạo kiểu nghệ thuật",
        location: "Chi nhánh Ninh Kiều, Cần Thơ",
        thumbnail: "/image/thumbnail.jpg",
      },
      {
        id: "3",
        title: "Khám Sức Khỏe Tổng Quát",
        price: "200.000 VND / lượt",
        category: "Bác sĩ thú y kinh nghiệm",
        location: "Chi nhánh Ninh Kiều, Cần Thơ",
        thumbnail: "/image/thumbnail.jpg",
      },
    ];

    res.render("client/pages/services/index", {
      pageTitle: "Danh sách Dịch vụ - Pet Care",
      services: services,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};
