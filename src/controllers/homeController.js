const getHomePage = async (req, res) => {
  res.render("home.ejs");
};
module.exports = {
  getHomePage,
};
