  const products = require("../models/productSchema");
  const categories = require("../models/categorySchema");
  const banners = require("../models/bannerSchema")
  const brands = require("../models/brandSchema")
  const user = require('../models/userSchema')
  const cart = require('../models/cartSchema')
  //RENDER HOME
  exports.home = async(req, res) => { 
    const superDeal = await products.find().limit(8).where({ listed :false}).populate('brand').exec();
    const dealOfDay = await products.find().limit(6).where({ listed :false}).populate("brand").exec();
    const category = await categories.find().exec();
    const todayOfferBanner = await banners.findOne({ title: "Fire Bolt" });
    const topDealBanner = await banners.findOne({ title: "Top Deal" });
    console.log(topDealBanner);
    res.render("user/index", {
      user: req.session.user,
      superDeal,
      dealOfDay,
      category,
      todayOfferBanner,
      topDealBanner,
    });
  }
//RENDER LOGIN
exports.login = (req, res) => {
  if (req.session.user) {
    res.redirect('/home')
  } 
     let message = "";// Variable to store the message
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message// Clear the message from the session
  }
  res.render('user/login', { message }); // Pass the message to the user-signup view
  }

//RENDER SIGNUP
exports.signup = async (req, res) => {
  let message = ""; 
  if (req.session.message) {
    message = req.session.message;
    delete req.session.message; 
  }
  res.render('user/signup', { message });
};

//RENDER LOGOUT
exports.logout = (req, res) => {
  req.session.destroy(err => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    // Redirect the user to the home page
    res.redirect('/home');
  });
}
//RENDER ALL PRODUCTS AND PAGINATION
exports.products = async (req, res) => {
  try {
    const page = parseInt(req.params.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    const productCount = await products.countDocuments();
    const sortOption = req.query.sortOption;
    let sortQuery = {};
    if (sortOption === "Name, A to Z") {
      sortQuery = { productName: 1 };
    } else if (sortOption === "Name, Z to A") {
      sortQuery = { productName: -1 };
    } else if (sortOption === "Price, high to low") {
      sortQuery = { price: -1 };
    } else if (sortOption === "Price, low to high") {
      sortQuery = { price: 1 };
    }
    const product = await products.find().sort(sortQuery).skip(skip).limit(limit).populate('brand').exec();
    const category = await categories.find();
    const brand = await brands.find();
    const categoryCounts = await Promise.all(
      category.map(async (Category) => {
        const count = await products.countDocuments({ category: Category._id });
        return { categoryId: Category._id, count };
      })
    );
    const selectedCategory = ""
    const selectedBrand =""
    res.render("user/product", {
      user: req.session.user,
      product,
      category,
      productCount,
      currentPage: page,
      totalPages: Math.ceil(productCount / limit),
      brand,
      selectedCategory,
      selectedBrand,
      page,
      limit,
      sortOption,
      categoryCounts,
    });
  } catch (err) {
    console.error("Error fetching products from MongoDB", err);
    res.status(500).send("Internal Server Error");
  }
};

  //RENDER ALL PRODUCTS FILTERED BY CATEGORY 
  exports.filterCategory = async (req, res) => {
    try {
      const selectedCategory = req.query.category_id;
      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const skip = (page - 1) * limit;
      const selectedBrand = "";
      const sortOption = req.query.sortOption;
      let sortQuery = {};
      if (sortOption === "Name, A to Z") {
        sortQuery = { productName: 1 };
      } else if (sortOption === "Name, Z to A") {
        sortQuery = { productName: -1 };
      } else if (sortOption === "Price, high to low") {
        sortQuery = { price: -1 };
      } else if (sortOption === "Price, low to high") {
        sortQuery = { price: 1 };
      }
      // Filter products by category if selectedCategory is not empty
      let query = {};
      if (selectedCategory) {
        query.category = selectedCategory;
      }
      const category = await categories.find();
      const categoryCounts = await Promise.all(
        category.map(async (Category) => {
          const count = await products.countDocuments({ category: Category._id });
          return { categoryId: Category._id, count };
        })
      );
      const productCount = await products.countDocuments(query);
      const product = await products
        .find(query)
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .populate("brand")
        .exec();
      const allCategories = await categories.find();
      let allBrands = await brands.find();

      if (selectedCategory) {
        allBrands = allBrands.filter(
          (brand) => brand.category.toString() === selectedCategory
        );
      }
      res.render("user/product", {
        user: req.session.user,
        product,
        category: allCategories,
        currentPage: page,
        totalPages: Math.ceil(productCount / limit),
        brand: allBrands,
        selectedCategory,
        selectedBrand,
        productCount,
        page,
        limit,
        sortOption,
        categoryCounts,
      });
    } catch (err) {
      console.error("Error filtering by category of products from MongoDB", err);
      res.status(500).send("Internal Server Error");
    }
  };

//RENDER ALL PRODUCTS FILTERED BY BRAND 
exports.filterBrands = async (req, res) => {
  try {
    const selectedBrand = req.query.brand_id;
    const page = parseInt(req.query.page) || 1;
    const limit = 9;
    const skip = (page - 1) * limit;
    let selectedCategory = "";
    const sortOption = req.query.sortOption;
    let sortQuery = {};
    if (sortOption === "Name, A to Z") {
      sortQuery = { productName: 1 };
    } else if (sortOption === "Name, Z to A") {
      sortQuery = { productName: -1 };
    } else if (sortOption === "Price, high to low") {
      sortQuery = { price: -1 };
    } else if (sortOption === "Price, low to high") {
      sortQuery = { price: 1 };
    }
    // Filter products by brand if selectedBrand is not empty
    let query = {};
    if (selectedBrand) {
      query.brand = selectedBrand;
      // Find the category of the selected brand
      const brand = await brands.findById(selectedBrand);
      if (brand) {
        selectedCategory = brand.category.toString();
      }
    }
    const category = await categories.find();
    const categoryCounts = await Promise.all(
      category.map(async (Category) => {
        const count = await products.countDocuments({ category: Category._id });
        return { categoryId: Category._id, count };
      })
    );
    const productCount = await products.countDocuments(query);
    const product = await products
      .find(query)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .populate("brand")
      .exec();
    const allCategories = await categories.find();
    let allBrands = await brands.find();
    if (selectedCategory) {
      allBrands = allBrands.filter(
        (brand) => brand.category.toString() === selectedCategory
      );
    }
    res.render("user/product", {
      user: req.session.user,
      product,
      category: allCategories,
      currentPage: page,
      totalPages: Math.ceil(productCount / limit),
      brand: allBrands,
      selectedCategory,
      selectedBrand,
      productCount,
      page,
      limit,
      sortOption,
      categoryCounts,
    });
  } catch (err) {
    console.error("Error filtering by category of products from MongoDB", err);
    res.status(500).send("Internal Server Error");
  }
}
// //RENDER ALL PRODUCTS BY PRICE
// exports.filterPrice = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = 9;
//     const skip = (page - 1) * limit;
//     const minPrice = parseInt(req.query.minPrice);
//     const maxPrice = parseInt(req.query.maxPrice);
//     const sortOption = req.query.sortOption;
//     let sortQuery = {};
//     if (sortOption === "Name, A to Z") {
//       sortQuery = { productName: 1 };
//     } else if (sortOption === "Name, Z to A") {
//       sortQuery = { productName: -1 };
//     } else if (sortOption === "Price, high to low") {
//       sortQuery = { price: -1 };
//     } else if (sortOption === "Price, low to high") {
//       sortQuery = { price: 1 };
//     }
//     let query = {};
//     if (!isNaN(minPrice) && !isNaN(maxPrice)) {
//       query.price = { $gte: minPrice, $lte: maxPrice };
//     }
//     const category = await categories.find();
//     const categoryCounts = await Promise.all(
//       category.map(async (Category) => {
//         const count = await products.countDocuments({ category: Category._id });
//         return { categoryId: Category._id, count };
//       })
//     );
//     const productCount = await products.countDocuments(query);
//     const product = await products
//       .find(query)
//       .sort(sortQuery)
//       .skip(skip)
//       .limit(limit)
//       .populate("brand")
//       .exec();
//     const allCategories = await categories.find();
//     let allBrands = await brands.find();
    
//     res.render("user/product", {
//       user: req.session.user,
//       product,
//       category: allCategories,
//       currentPage: page,
//       totalPages: Math.ceil(productCount / limit),
//       brand: allBrands,
//       selectedCategory: "",
//       selectedBrand: "",
//       productCount,
//       page,
//       limit,
//       sortOption,
//       categoryCounts,
//       minPrice,
//       maxPrice
//     });
//   } catch (err) {
//     console.error("Error filtering by price of products from MongoDB", err);
//     res.status(500).send("Internal Server Error");
//   }
// };



//RENDER CONTACT US
exports.contactUs = async (req, res) => { 
  const category = await categories.find()
  res.render("user/contact", {
    user: req.session.user,
    category,
  });
}

  //RENDER PRODUCT DETAILS
  exports.productDetails = async (req, res) => {
    try {
      console.log(req.session.user);
      const productId = req.params.id; // extract the product ID from the query string
      const product = await products.findById({ _id: productId }); // find the product by ID using Mongoose
      res.render("user/details", { product ,user:req.session.user}); // render the product-detail.ejs page and pass the product details
    } catch (error) {
      console.error(error);
      res.status(500).send("Server Error");
    }
  };

  //RENDER CHECKOUT
exports.checkout =async (req, res) => { 
   const category = await categories.find()
  res.render("user/checkout", { 
    user: req.session.user,
    category
  });
}
//RENDER CART
exports.cart = async (req, res) => {
  try {
    const category = await categories.find();
    const userId = req.session.user._id;
    const cartItems = await cart.findOne({ userId }).populate("products.productId");
    // Calculate the total amount of the products in the cart
    let total = 0;
    cartItems.products.forEach((product) => {
      total += product.productId.price * product.quantity;
    });
    res.render("user/cart", {
      user: req.session.user,
      category,
      cartItems,
      total
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving cart data");
  }
};

//RENDER OTP LOGIN
exports.otplogin = (req, res) => {
  res.header('Cache-Control', 'no-store');
  res.header('Pragma', 'no-cache');
  res.header('Expires', '0');
  res.render('user/login-otp',)
}

//RENDER FORGOT PASSWORD 
exports.forgotPassword = (req, res) => {
  res.render('user/forgotPassword')
}
//RENDER RESET PASWORD
exports.resetPassword = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) {
      return res.status(404).send("Page not found");
    }
    const userCredential = await user.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!userCredential) {
      return res.status(404).send("Page not found");
    }
    res.render("user/resetPassword", { token });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
};
