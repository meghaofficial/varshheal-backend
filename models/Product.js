// Product controller (e.g., createProduct)
const createProduct = async (req, res) => {
  try {
    const { name, price, category } = req.body;

    const product = await Product.create({ name, price, category });

    // Increment the product count in category
    await Category.findOneAndUpdate(
      { _id: category },
      { $inc: { products: 1 } }
    );

    res.status(201).json({ success: true, product });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ success: false, message: "Failed to create product" });
  }
};


await Category.findOneAndUpdate(
  { _id: product.category },
  { $inc: { products: -1 } }
);
