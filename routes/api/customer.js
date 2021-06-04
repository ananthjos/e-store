const express = require("express");
const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const Customer = require("../../models/Customer");
const Pastorders = require("../../models/Pastorders");
const jwt = require("jsonwebtoken");
const config = require("config");
const auth = require("../../middleware/Auth");
const { find } = require("../../models/Customer");
const router = express.Router();
const sendEmail = require("../sendEmail");

// customer register
router.post(
  "/register",
  [
    body("name", "please enter name").not().isEmpty(),
    body("password", "please enter password").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let { name, email, password } = req.body;
      let customer = await Customer.findOne({ email });
      if (customer) {
        res.status(401).json("email  already in use");
      }
      customer = Customer({
        name,
        email,
        password,
      });
      // password encryption
      const salt = await bcrypt.genSalt(10);
      customer.password = await bcrypt.hash(password, salt);

      await customer.save();

      // issue token
      const payload = { customer: customer.id };
      jwt.sign(
        payload,
        config.get("jwtsecret"),
        { expiresIn: 36000000 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// customer login
router.post(
  "/login",
  [
    body("email", "please enter email").isEmail(),
    body("password", "please enter password").isLength({ min: 8 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let { email, password } = req.body;
      let customer = await Customer.findOne({ email });
      if (!customer) {
        res.status(401).json({ msg: "Invalid Credentials" });
      }
      // check password
      const isMatch = await bcrypt.compare(password, customer.password);

      if (!isMatch) {
        return res.status(401).json({ msg: "Invalid Credentials" });
      }

      // issue token
      const payload = { customer: customer.id };
      jwt.sign(
        payload,
        config.get("jwtsecret"),
        { expiresIn: 36000000 },
        (err, token) => {
          if (err) throw err;
          res.status(200).json({ token });
        }
      );
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// customer delete
router.delete("/delete", auth, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.customer);
    res.status(200).json({ msg: "Account deleted successfully" });
  } catch (error) {
    res.status(200).json({ error: error.message });
  }
});

// customer update
router.put("/update", auth, async (req, res) => {
  try {
    let { name, email, password, address, phone, image } = req.body;
    let customer = await Customer.findById(req.customer);
    let hashedPassword = "";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    let updCustomer = await Customer.findByIdAndUpdate(req.customer, {
      name: name ? name : customer.name,
      email: email ? email : customer.email,
      password: password ? hashedPassword : customer.password,
      phone: phone ? phone : customer.phone,
      image: image ? image : customer.image,
      address: address
        ? {
            state: address.state ? address.state : customer.address.state,
            city: address.city ? address.city : customer.address.city,
            pincode: address.pincode
              ? address.pincode
              : customer.address.pincode,
            address1: address.address1
              ? address.address1
              : customer.address.address1,
          }
        : customer.address,
    });
    res
      .status(200)
      .json({ msg: "Account Details updated successfully", updCustomer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//fetch single customer
router.get("/", auth, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer).select("-password");
    let pastorders = await Pastorders.find({ customer: req.customer });
    res.status(200).json({ customer });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// save customer past orders
router.post("/pastorders", auth, async (req, res) => {
  try {
    let { product } = req.body;
    let customer = await Pastorders.findOne({
      customer: mongoose.Types.ObjectId(req.customer),
    });

    if (customer) {
      await Pastorders.findByIdAndUpdate(customer._id, {
        $push: {
          orders: product,
        },
      });
    } else {
      let pastorders = new Pastorders({
        customer: req.customer,
        orders: product,
      });
      await pastorders.save();
    }

    res.status(200).json({ msg: "orders saved successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// get pastorders
router.get("/orders-history", auth, async (req, res) => {
  try {
    let customer = await Pastorders.find({ customer: req.customer }).sort({
      date: -1,
    });
    res.status(200).json(customer[0].orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// forgot password
router.post("/forgot", async (req, res) => {
  try {
    const { email } = req.body;
    const customer = await Customer.findOne({ email });
    if (!customer) {
      return res.status(401).json({ msg: "User does not exist" });
    }
    // generate token
    const resetToken = crypto.randomBytes(20).toString("hex");
    // hash token
    customer.resetPasswordToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");
    customer.tokenExpiry = Date.now() + 600 * 1000;
    // save customer to db
    await customer.save();

    const resetLink = `https://ananth-e-store.netlify.app/resetpassword/${resetToken}`;
    sendEmail({ email, resetLink });

    res
      .status(200)
      .json({ msg: "Resetlink sent to your registered email address" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// resetPassword
router.put("/resetPassword/:resetToken", async (req, res) => {
  try {
    let hashedToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");
    const customer = await Customer.findOne({
      resetPasswordToken: hashedToken,
      tokenExpiry: { $gt: Date.now() },
    });
    if (!customer) {
      return res.status(401).json({ msg: "Inavlid Link" });
    }

    if (req.body.password) {
      // password encryption
      const salt = await bcrypt.genSalt(10);
      customer.password = await bcrypt.hash(req.body.password, salt);
      await customer.save();
      res.status(200).json({ msg: "Password changed successfully" });
    } else {
      res.status(401).json({ msg: "Please enter password" });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
    // delete customer resetToken
    let hashedToken = crypto
      .createHash("sha256")
      .update(req.params.resetToken)
      .digest("hex");
    await Customer.findOneAndUpdate(
      { resetPasswordToken: hashedToken },
      {
        resetPasswordToken: undefined,
        tokenExpiry: undefined,
      }
    );
  }
});

module.exports = router;
