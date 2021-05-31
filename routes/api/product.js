const express = require("express");
const { body, validationResult } = require("express-validator");
const auth = require("../../middleware/Auth");
const Product = require("../../models/Product");
const Cart = require("../../models/Cart");
const router = express.Router();

// add product
router.post(
  "/add",
  [
    auth,
    body("title", "please enter product title").not().isEmpty(),
    body("description", "pleas enter product description").not().isEmpty(),
    body("image", "please enter product image url").not().isEmpty(),
    body("price", "pleas enter product price").not().isEmpty(),
    body("quantity", "pleas enter product quantity").not().isEmpty(),
  ],
  async (req, res) => {
    if (req.customer !== "ananth@gmail.com") {
      res.status(401).json({ msg: "admin access denied" });
    } else {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }
      try {
        let { title, description, image, price, quantity } = req.body;
        let product = await Product.findOne({ title });
        if (product) {
          return res
            .status(401)
            .json({ msg: "product already exists in database" });
        }
        product = new Product({
          title,
          description,
          image,
          price,
          quantity,
        });
        await product.save();
        res.status(200).json({ msg: "product added to database" });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    }
  }
);

// fetch products
router.get("/all", async (req, res) => {
  // console.log(req);
  const limit = req.query.limit || 10;
  const skip = req.query.skip || 0;
  try {
    const products = await Product.find()
      .limit(Number(limit))
      .skip(Number(skip));

    res.status(200).json({ products });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete product
router.delete("/delete/:id", auth, async (req, res) => {
  if (req.customer !== "ananth@gmail.com") {
    res.status(401).json({ msg: "admin access denied" });
  } else {
    try {
      await Product.findByIdAndDelete(req.params.id);
      res
        .status(200)
        .json({ msg: "product deleted from database successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});

// update product
router.put("/update/:id", auth, async (req, res) => {
  if (req.customer !== "ananth@gmail.com") {
    res.status(401).json({ msg: "admin access denied" });
  } else {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      let { title, description, image, price, quantity } = req.body;
      let product = await Product.findById(req.params.id);
      await Product.findByIdAndUpdate(req.params.id, {
        title: title ? title : product.title,
        description: description ? description : product.description,
        image: image ? image : product.image,
        price: price ? price : product.price,
        quantity: quantity ? quantity : product.quantity,
      });
      res.status(200).json({ msg: "Product details updated successfully" });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
});

// // add to cart
// router.post("/addto-cart/:id", auth, async (req, res) => {
//   try {
//     let product = await Product.findById(req.params.id);

//     let { title, description, image, price, quantity } = product;
//     product = new Cart({
//       title,
//       description,
//       image,
//       price,
//       quantity,
//       customer: req.customer,
//     });
//     await product.save();
//     console.log(product);
//     res.status(200).json({ msg: "saved successfully" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // get products from cart
// router.get("/cart", auth, async (req, res) => {
//   try {
//     let cart = await Cart.find({ customer: req.customer });
//     res.status(200).json({ cart });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // delete from cart
// router.delete("/cart/:id", auth, async (req, res) => {
//   try {
//     await Cart.findByIdAndDelete(req.params.id);
//     res.status(200).json({ msg: "item removed" });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

module.exports = router;
