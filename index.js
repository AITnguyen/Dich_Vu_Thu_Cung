const express = require("express");
require("dotenv").config();
const clientRouter = require("./routes/client/index.router");

const app = express();
const port = process.env.PORT || 3000;

// Public
app.use(express.static(`${__dirname}/public`));

// Pug
app.set("views", "./views");
app.set("view engine", "pug");

// Route
clientRouter(app);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
