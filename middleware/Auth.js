const jwt = require("jsonwebtoken");
const config = require("config");

module.exports = function (req, res, next) {
  // check token
  let token = req.header("x-auth-token");
  if (!token) {
    return res.status(401).json({ msg: "Unauthorized access" });
  }
  // verify token
  try {
    const decoded = jwt.verify(token, config.get("jwtsecret"));
    req.customer = decoded.customer ? decoded.customer : decoded.admin;
    next();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
