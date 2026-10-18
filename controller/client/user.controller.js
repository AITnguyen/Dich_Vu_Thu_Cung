const KHACH_HANG = require("../../models/KHACH_HANG.model");

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
