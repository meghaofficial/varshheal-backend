const Address = require("../models/Address");

const createAddress = async (req, res) => {
  try {
    const userId = req.user._id || req.body.googleId;
    const {
      name,
      phone,
      alternate_phone,
      pincode,
      locality,
      address,
      city,
      state,
      landmark,
      address_type,
    } = req.body;

    // Normalize address (trim, lowercase) for accurate comparison
    const normalizedAddress = address.trim().toLowerCase();

    // Check for existing same address for this user
    const existingAddress = await Address.findOne({
      userId,
      address: { $regex: new RegExp(`^${normalizedAddress}$`, "i") },
      pincode,
      city,
      state,
    });

    if (existingAddress) {
      return res.status(409).json({
        success: false,
        message: "Address already exists",
      });
    }

    const newAddress = await Address.create({
      userId,
      name,
      phone,
      alternate_phone,
      pincode,
      locality,
      address,
      city,
      state,
      landmark,
      address_type,
    });

    res.status(201).json({
      success: true,
      message: "Address added successfully",
      address: newAddress,
    });
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create address",
      error: error.message,
    });
  }
};

const updateAddress = async (req, res) => {};

const getAllAddresses = async (req, res) => {};

module.exports = {
  createAddress,
  updateAddress,
  getAllAddresses,
};
