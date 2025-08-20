const connection = require("../config/database");

const getHomePage = (req, res) => {
  // let users = [];
  // connection.query("SELECT * FROM Users", function (err, result) {
  //   users = result;
  //   console.log(">>> result home page =  ", result);
  //   res.send(JSON.stringify(users));
  // });
  res.render("home.ejs");
};

const getHaoTuHoc = (req, res) => {
  res.render("sample.ejs");
};

const postCreateUser = (req, res) => {
  let email = req.body.email;
  let name = req.body.name;
  let city = req.body.city;
  //console.log(">>>>email: ", email, ">>>>name: ", name, ">>>>city: ", city);
  connection.query(
    `INSERT INTO Users (email,name,city)
     VALUES (?,?,?)
    `,
    [email, name,city],
    function (err, results) {
      console.log(results);
      res.send('Created user succeed!')
    }
  );
};
module.exports = {
  getHomePage,
  getHaoTuHoc,
  postCreateUser,
};
