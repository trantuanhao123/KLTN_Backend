const connection = require("../config/database");
const {
  getAllUser,
  getUser,
  createUser,
  editUser,
} = require("../services/CRUDService");

const getHomePage = async (req, res) => {
  // let users = [];
  // connection.query("SELECT * FROM Users", function (err, result) {
  //   users = result;
  //   console.log(">>> result home page =  ", result);
  //   res.send(JSON.stringify(users));
  // });

  // console.log(">>>>>check result: ", results);
  let results = await getAllUser();
  res.render("home.ejs", { listUsers: results });
};

const getHaoTuHoc = (req, res) => {
  res.render("sample.ejs");
};
const getCreateForm = (req, res) => {
  res.render("create.ejs");
};
const getEditForm = async (req, res) => {
  const userID = req.params.id;
  const user = await getUser(userID);
  res.render("edit.ejs", { userEdit: user });
};
const postCreateUser = async (req, res) => {
  const { email, name, city } = req.body;
  const results = await createUser(email, name, city);
  res.send(results);
};
const postEditUser = async (req, res) => {
  const { email, name, city, id } = req.body;
  const results = await editUser(email, name, city, id);
  res.send(results);
};
module.exports = {
  getHomePage,
  getHaoTuHoc,
  postCreateUser,
  postEditUser,
  getCreateForm,
  getEditForm,
};
