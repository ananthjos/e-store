const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const admin = require("./routes/api/admin");
const customer = require("./routes/api/customer");
const product = require("./routes/api/product");
const app = express();

// connect db
connectDB();
app.use(express.json());
app.use(cors());
app.use("/api/admin", admin);
app.use("/api/customer", customer);
app.use("/api/product", product);

app.get("/", (req, res) => {
  res.send("welcome");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`server started at port ${PORT}`));
