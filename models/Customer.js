const mongoose = require("mongoose");
const CustomerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
  },
  image: {
    type: String,
  },
  address: {
    state: {
      type: String,
    },
    city: {
      type: String,
    },
    pincode: {
      type: Number,
    },
    address1: {
      type: String,
    },
  },
  date: {
    type: Date,
    default: Date.now(),
  },
});

module.exports = Customer = mongoose.model("customers", CustomerSchema);
