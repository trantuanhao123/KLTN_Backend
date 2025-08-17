const connection = require("../config/database");

const getHomePage = (req, res) => {
  let users = [];
  connection.query("SELECT * FROM Users", function (err, result) {
    users = result;
    console.log(">>> result home page =  ", result);
    res.send(JSON.stringify(users));
  });
};

const getHaoTuHoc = (req, res) => {
  res.render("sample.ejs");
};
module.exports = {
  getHomePage,
  getHaoTuHoc,
};
