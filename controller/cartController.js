const Cart = require("../models/Cart");
const Product = require("../models/Product");

const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id })
      .populate("items.product", "name price images sku");

    return res.status(200).json(cart || { items: [] });
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const addToCart = async (req, res) => {
  try {
    const { productId, quantity, price, variant } = req.body;

    let cart = await Cart.findOne({ user: req.user._id });

    // If cart doesn't exist → create new
    if (!cart) {
      cart = new Cart({
        user: req.user._id,
        items: [{ product: productId, quantity, price, variant }]
      });
    } else {
      // Check if product already inside cart
      const itemIndex = cart.items.findIndex(
        (i) =>
          i.product.toString() === productId &&
          JSON.stringify(i.variant) === JSON.stringify(variant || {})
      );

      if (itemIndex > -1) {
        // Increase quantity
        cart.items[itemIndex].quantity += quantity;
      } else {
        cart.items.push({ product: productId, quantity, price, variant });
      }
    }

    await cart.save();

    return res.status(200).json({
      success: true,
      message: "Item has been successfully added",
      cart
    });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};



const updateCart = async (req, res) => {
  try {
    const { productId, quantity, variant } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    const itemIndex = cart.items.findIndex(
      (i) => { 
            return i.product._id.toString() === productId 
      });

    if (itemIndex === -1)
      return res.status(404).json({ message: "Product not in cart" });

    
    const product = await Product.findById(productId);
    if (!product) 
      return res.status(404).json({ message: "Product not found" });

    if (quantity > product.stock) {
      return res.status(400).json({
      //   message: `Only ${product.stock} items available in stock`,
      //   availableStock: product.stock,
      });
    }
    
    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      cart.items[itemIndex].quantity = quantity;
    }

    await cart.save();

    return res.status(200).json(cart);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};


const removeFromCart = async (req, res) => {
  try {
    const { productId, variant } = req.body;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = cart.items.filter(
      (i) =>
        !(i.product.toString() === productId &&
        JSON.stringify(i.variant) === JSON.stringify(variant || {}))
    );

    await cart.save();

    return res.status(200).json(cart);

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) return res.status(404).json({ message: "Cart not found" });

    cart.items = [];
    await cart.save();

    return res.status(200).json({ message: "Cart cleared" });

  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

module.exports = {
      getCart,
      addToCart,
      updateCart,
      removeFromCart,
      clearCart
}
