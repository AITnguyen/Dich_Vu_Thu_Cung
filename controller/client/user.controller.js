const KHACH_HANG = require("../../models/KHACH_HANG.model");

// [GET] /user/info - Xem thông tin cá nhân
module.exports.info = async (req, res) => {
  try {
    const userId = req.session?.userId || req.user?._id;

    const user = await KHACH_HANG.findOne({
      _id: userId,
      deleted: false,
    });

    if (!user) {
      return res.redirect("/auth/signin");
    }

    res.render("client/pages/user/info", {
      title: "Thông tin cá nhân - PetCare",
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [GET] /user/edit - Giao diện chỉnh sửa thông tin
module.exports.edit = async (req, res) => {
  try {
    const userId = req.session?.userId || req.user?._id;

    const user = await KHACH_HANG.findOne({
      _id: userId,
      deleted: false,
    });

    if (!user) {
      return res.redirect("/auth/signin");
    }

    res.render("client/pages/user/edit", {
      title: "Chỉnh sửa thông tin - PetCare",
      user: user,
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [POST] /user/edit - Xử lý cập nhật thông tin
module.exports.editPost = async (req, res) => {
  try {
    const userId = req.session?.userId || req.user?._id;
    const { fullName, phone, email } = req.body;

    await KHACH_HANG.updateOne(
      { _id: userId },
      {
        fullName: fullName,
        phone: phone,
        email: email,
      },
    );

    res.redirect("/user/info");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [GET] /user/reset-password - Giao diện đổi mật khẩu
module.exports.resetPassword = async (req, res) => {
  try {
    res.render("client/pages/user/resetPassword", {
      title: "Đổi mật khẩu - PetCare",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [POST] /user/reset-password - Xử lý đổi mật khẩu
module.exports.resetPasswordPost = async (req, res) => {
  try {
    const userId = req.session?.userId || req.user?._id;
    const { password, newPassword } = req.body;

    const user = await KHACH_HANG.findOne({ _id: userId });

    if (!user || user.password !== password) {
      console.log("Mật khẩu hiện tại không đúng!");
      return res.redirect("back");
    }

    await KHACH_HANG.updateOne({ _id: userId }, { password: newPassword });

    res.redirect("/user/info");
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};
