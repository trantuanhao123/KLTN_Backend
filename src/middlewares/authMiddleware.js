const jwt = require("jsonwebtoken");
const UserModel = require("../models/user");

async function authMiddleware(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) return res.sendStatus(401);

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "khongdoanduocdau"
    );
    const user = await UserModel.findById(decoded.userId);
    if (!user) return res.sendStatus(403);
    req.user = {
      USER_ID: user.USER_ID,
      EMAIL: user.EMAIL,
      PHONE: user.PHONE,
      ROLE: user.ROLE,
      VERIFIED: user.VERIFIED,
      PROVIDER: user.PROVIDER,
      FULLNAME: user.FULLNAME,
      BIRTHDATE: user.BIRTHDATE,
      AVATAR_URL: user.AVATAR_URL,
      ADDRESS: user.ADDRESS,
      ID_CARD: user.ID_CARD,
      LICENSE_FRONT_URL: user.LICENSE_FRONT_URL,
      LICENSE_BACK_URL: user.LICENSE_BACK_URL,
      RATING: user.RATING,
      CREATED_AT: user.CREATED_AT,
    };
    next();
  } catch (error) {
    res.status(403).json({ error: "Invalid token" });
  }
}

module.exports = authMiddleware;
