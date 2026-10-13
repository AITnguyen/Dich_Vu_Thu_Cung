// [GET] /auth/signup
module.exports.signup = async (req, res) => {
  try {
    res.render("client/pages/auth/signup", {
      pageTitle: "Đăng ký tài khoản",
      path: "/auth/signup",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [GET] /auth/signin
module.exports.signin = async (req, res) => {
  try {
    res.render("client/pages/auth/signin", {
      pageTitle: "Đăng nhập hệ thống",
      path: "/auth/signin",
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};

// [POST] /auth/signin
module.exports.signinPost = async (req, res) => {
  try {
    const { email, password } = req.body;
    req.session.user = { email: email };
    res.redirect("/");
  } catch (error) {
    console.log(error);
    res.redirect("/auth/signin");
  }
};

// [GET] /auth/logout
module.exports.logout = async (req, res) => {
  try {
    req.session.destroy((err) => {
      if (err) {
        console.log(err);
      }
      res.redirect("/auth/signin");
    });
  } catch (error) {
    console.log(error);
    res.redirect("/");
  }
};
