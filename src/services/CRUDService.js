const connection = require("../config/database");

const getAllUser = async () => {
  const [results, fields] = await connection.query("SELECT * FROM Users");
  return results;
};
const getUser = async (id) => {
  const [results, fields] = await connection.query(
    "SELECT * FROM Users WHERE id = ?",
    [id]
  );
  return (user = results && results.length > 0 ? results[0] : {});
};
const createUser = async (email, name, city) => {
  const [results] = await connection.query(
    `INSERT INTO Users (email,name,city)
     VALUES (?,?,?)
    `,
    [email, name, city]
  );
  return results;
};
const editUser = async (email, name, city, id) => {
  const [results] = await connection.query(
    `UPDATE Users 
      SET email = ?, name=?, city =? 
      WHERE id = ? 
    `,
    [email, name, city, id]
  );
  return results;
};
const deleteUser = async (id) => {
  const [results] = await connection.query(
    `DELETE FROM Users 
      WHERE id = ? 
    `,
    [id]
  );
  return results;
};
module.exports = {
  getAllUser,
  getUser,
  createUser,
  editUser,
  deleteUser,
};
