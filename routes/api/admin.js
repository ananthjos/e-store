const express = require("express");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const Admin = require("../../models/Admin");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/Auth");
const router = express.Router();

// admin login
router.post("/login", async (req, res) => {
  if (req.body.email !== "ananth@gmail.com") {
    res.status(401).json({ msg: "admin access denied" });
  } else {
    try {
      let admin = await Admin.find();
      const password = admin[0].password;
      const isMatch = await bcrypt.compare(req.body.password, password);
      if (!isMatch) {
        res.status(401).json({ msg: "admin access denied" });
      }
      const payload = { admin: "ananth@gmail.com" };
      jwt.sign(
        payload,
        config.get("jwtsecret"),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});

router.get("/test", auth, (req, res) => {
  // console.log(req);
  if (req.user !== "ananth@gmail.com") {
    res.status(400).json({ msg: "access denied" });
  }
  res.send("test");
});
module.exports = router;
