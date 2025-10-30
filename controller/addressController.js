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

const getAllAddresses = async (req, res) => {
  try {
    
    const userId = req.user._id || req.query.googleId;

    const allAddress = await Address.find({ userId });

    return res.status(200).json({
      success: true,
      address: allAddress
    });

  } catch (error) {
    console.error("Error getting address:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get address",
      error: error.message,
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ success: false, message: "Address ID is required" });
    }

    const address = await Address.deleteOne({ _id: id });

    return res.status(200).json({
      success: true,
      message: "Successfully deleted the address",
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete address",
      error: error.message,
    });
  }
};

const updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
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

    // Ensure the address belongs to the logged-in user
    const existingAddress = await Address.findOne({ _id: id, userId });
    if (!existingAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found or does not belong to user",
      });
    }

    // Update only provided fields
    const updatedAddress = await Address.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(alternate_phone && { alternate_phone }),
          ...(pincode && { pincode }),
          ...(locality && { locality }),
          ...(address && { address }),
          ...(city && { city }),
          ...(state && { state }),
          ...(landmark && { landmark }),
          ...(address_type && { address_type }),
        },
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Address updated successfully",
      address: updatedAddress,
    });
  } catch (error) {
    console.error("Error updating address:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update address",
      error: error.message,
    });
  }
};


module.exports = {
  createAddress,
  updateAddress,
  getAllAddresses,
  deleteAddress
};
