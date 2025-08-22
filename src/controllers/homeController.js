const connection = require("../config/database");
const {
  getAllUser
} = require("../services/CRUDService")

const getHomePage = async (req, res) => {
  // let users = [];
  // connection.query("SELECT * FROM Users", function (err, result) {
  //   users = result;
  //   console.log(">>> result home page =  ", result);
  //   res.send(JSON.stringify(users));
  // });
  
  // console.log(">>>>>check result: ", results);
  let results = await getAllUser()
  res.render("home.ejs",{listUsers:results});
};

const getHaoTuHoc = (req, res) => {
  res.render("sample.ejs");
};
const getCreateForm = (req, res) => {
  res.render("create.ejs")
};
const getEditForm = (req,res) => {
  res.render("edit.ejs")
}
const postCreateUser = async(req, res) => {
  let email = req.body.email;
  let name = req.body.name;
  let city = req.body.city;
  //console.log(">>>>email: ", email, ">>>>name: ", name, ">>>>city: ", city);
  // connection.query(
  //   `INSERT INTO Users (email,name,city)
  //    VALUES (?,?,?)
  //   `,
  //   [email, name, city],
  //   function (err, results) {
  //     console.log(results);
  //     res.send("Created user succeed!");
  //   }
  // );
  let [results, fields] = await connection.query(
    `INSERT INTO Users (email,name,city)
     VALUES (?,?,?)
    `,
    [email, name, city]
  );
  console.log(">>>>>>>check result: ",results)
  res.send("Created user succeed!");
};
module.exports = {
  getHomePage,
  getHaoTuHoc,
  postCreateUser,
  getCreateForm,
  getEditForm
};
