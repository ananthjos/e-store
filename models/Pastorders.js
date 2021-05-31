const mongoose = require("mongoose");
const PastordersSchema = new mongoose.Schema({
  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "customer",
  },
  orders: {
    type: [{}],
  },
  // date: {
  //   type: Date,
  //   default: Date.now(),
  // },
});

module.exports = Pastorders = mongoose.model("pastorders", PastordersSchema);
