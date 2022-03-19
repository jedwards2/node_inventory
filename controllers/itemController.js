let Item = require("../models/item");
let Category = require("../models/category");
const { body, validationResult } = require("express-validator");

let async = require("async");

exports.index = function (req, res) {
  async.parallel(
    {
      item_count: function (callback) {
        Item.countDocuments({}, callback); // Pass an empty object as match condition to find all documents of this collection
      },
      category_count: function (callback) {
        Category.countDocuments({}, callback);
      },
    },
    function (err, results) {
      res.render("index", {
        title: "Home",
        error: err,
        data: results,
      });
    }
  );
};

exports.item_list = function (req, res) {
  Item.find({}, "name price number_in_stock")
    .sort({ title: 1 })
    .populate("price")
    .exec(function (err, list_items) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("item_list", { title: "Pet List", item_list: list_items });
    });
};

// Display detail page for a specific Item.
exports.item_detail = function (req, res) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id)
          .populate("name")
          .populate("category")
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Successful, so render.
      res.render("item_detail", {
        title: results.item.name,
        item: results.item,
      });
    }
  );
};

// Display Item create form on GET.
exports.item_create_get = function (req, res, next) {
  // Get all authors and genres, which we can use for adding to our book.
  async.parallel(
    {
      items: function (callback) {
        Item.find(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("item_form", {
        title: "Create Item",
        items: results.items,
        categories: results.categories,
      });
    }
  );
};

// Handle item create on POST.
exports.item_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  // Validate and sanitize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("price", "Summary must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("number_in_stock", "Number in stock must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("category.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped and trimmed data.
    var item = new Item({
      name: req.body.name,
      price: req.body.price,
      number_in_stock: req.body.number_in_stock,
      category: req.body.category,
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel(
        {
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.categories.length; i++) {
            if (item.category.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("item_form", {
            title: "Create Item",
            categories: results.categories,
            item: item,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Save book.
      item.save(function (err) {
        if (err) {
          return next(err);
        }
        //successful - redirect to new book record.
        res.redirect(item.url);
      });
    }
  },
];

// Display Item delete form on GET.
exports.item_delete_get = function (req, res, next) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        res.redirect("/catalog/items");
      }
      // Successful, so render.
      res.render("item_delete", {
        title: "Delete Item",
        item: results.item,
      });
    }
  );
};

// Handle Item delete on POST.
exports.item_delete_post = function (req, res, next) {
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.body.itemid).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } else {
        Item.findByIdAndRemove(req.body.itemid, function deleteItemy(err) {
          if (err) {
            return next(err);
          }
          // Success - go to author list
          res.redirect("/catalog/items");
        });
      }
    }
  );
};

// Display book update form on GET.
exports.item_update_get = function (req, res, next) {
  // Get book, authors and genres for form.
  async.parallel(
    {
      item: function (callback) {
        Item.findById(req.params.id).populate("category").exec(callback);
      },
      categories: function (callback) {
        Category.find(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      if (results.item == null) {
        // No results.
        var err = new Error("Book not found");
        err.status = 404;
        return next(err);
      }
      // Success.
      // Mark our selected genres as checked.
      for (
        var all_g_iter = 0;
        all_g_iter < results.categories.length;
        all_g_iter++
      ) {
        for (
          var book_g_iter = 0;
          book_g_iter < results.item.category.length;
          book_g_iter++
        ) {
          if (
            results.categories[all_g_iter]._id.toString() ===
            results.item.category[book_g_iter]._id.toString()
          ) {
            results.categories[all_g_iter].checked = "true";
          }
        }
      }
      res.render("item_form", {
        title: "Update Item",
        categories: results.categories,
        item: results.item,
      });
    }
  );
};

// Handle book update on POST.
exports.item_update_post = [
  // Convert the genre to an array
  (req, res, next) => {
    if (!(req.body.category instanceof Array)) {
      if (typeof req.body.category === "undefined") req.body.category = [];
      else req.body.category = new Array(req.body.category);
    }
    next();
  },

  // Validate and sanitize fields.
  body("name", "Name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("price", "Price must not be empty.")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("number_in_stock", "Stock must not be empty")
    .trim()
    .isLength({ min: 1 })
    .escape(),
  body("category.*").escape(),

  // Process request after validation and sanitization.
  (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a Book object with escaped/trimmed data and old id.
    var item = new Item({
      name: req.body.name,
      price: req.body.price,
      number_in_stock: req.body.number_in_stock,
      category:
        typeof req.body.category === "undefined" ? [] : req.body.category,
      _id: req.params.id, //This is required, or a new ID will be assigned!
    });

    if (!errors.isEmpty()) {
      // There are errors. Render form again with sanitized values/error messages.

      // Get all authors and genres for form.
      async.parallel(
        {
          categories: function (callback) {
            Category.find(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          }

          // Mark our selected genres as checked.
          for (let i = 0; i < results.categories.length; i++) {
            if (item.category.indexOf(results.categories[i]._id) > -1) {
              results.categories[i].checked = "true";
            }
          }
          res.render("item_form", {
            title: "Update Item",
            categories: results.categories,
            item: item,
            errors: errors.array(),
          });
        }
      );
      return;
    } else {
      // Data from form is valid. Update the record.
      Item.findByIdAndUpdate(req.params.id, item, {}, function (err, theitem) {
        if (err) {
          return next(err);
        }
        // Successful - redirect to book detail page.
        res.redirect(theitem.url);
      });
    }
  },
];
