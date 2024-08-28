const express = require("express");
const { isSeller, isAuthenticated, isAdmin } = require("../middleware/auth");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const router = express.Router();
const Category = require("../model/category");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");

// Create category
router.post(
  "/create-category",
  catchAsyncErrors(async (req, res, next) => {
    try {
      let image;

      if (typeof req.body.image === "string") {
        image = req.body.image;
      }

      const result = await cloudinary.v2.uploader.upload(image, {
        folder: "categories",
      });

      const categoryData = {
        name: req.body.name,
        description: req.body.description,
        image: {
          public_id: result.public_id,
          url: result.secure_url,
        },
      };

      const category = await Category.create(categoryData);

      res.status(201).json({
        success: true,
        category,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// Get all categories
router.get(
  "/get-all-categories",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const categories = await Category.find().sort({ createdAt: -1 });

      res.status(201).json({
        success: true,
        categories,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// Delete category
router.delete(
  "/delete-category/:id",
  isAdmin("Admin"),
  catchAsyncErrors(async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return next(new ErrorHandler("Category not found with this id", 404));
      }

      await cloudinary.v2.uploader.destroy(category.image.public_id);
      await category.deleteOne();

      res.status(201).json({
        success: true,
        message: "Category deleted successfully!",
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

// Get category by ID
router.get(
  "/get-category/:id",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const category = await Category.findById(req.params.id);

      if (!category) {
        return next(new ErrorHandler("Category not found with this id", 404));
      }

      res.status(200).json({
        success: true,
        category,
      });
    } catch (error) {
      return next(new ErrorHandler(error, 400));
    }
  })
);

module.exports = router;
