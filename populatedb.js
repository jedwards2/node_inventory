#! /usr/bin/env node

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
let async = require("async");
let Item = require("./models/item");
let Category = require("./models/category");

var mongoose = require("mongoose");
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

let items = [];
let categories = [];

function itemCreate(name, category, price, number_in_stock, cb) {
  itemDetail = {
    name: name,
    category: category,
    price: price,
    number_in_stock: number_in_stock,
  };
  let item = new Item(itemDetail);

  item.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Item: " + item);
    items.push(item);
    cb(null, item);
  });
}

function categoryCreate(name, description, cb) {
  let category = new Category({ name: name, description: description });

  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Category: " + category);
    categories.push(category);
    cb(null, category);
  });
}

function createCategories(cb) {
  async.series(
    [
      function (callback) {
        categoryCreate("Hamster", "4 legs, extremely dangerous", callback);
      },
      function (callback) {
        categoryCreate("Dog", "4 legs, goes woof", callback);
      },
      function (callback) {
        categoryCreate("Cat", "4 legs, goes meow", callback);
      },
    ],
    // optional callback
    cb
  );
}

function createItems(cb) {
  async.parallel(
    [
      function (callback) {
        itemCreate("Fido", categories[1], "531512", "5", callback);
      },
      function (callback) {
        itemCreate("Mr Meow", categories[2], "2632625", "4", callback);
      },
      function (callback) {
        itemCreate("Chuckles", categories[0], "535342", "2", callback);
      },
    ],
    // optional callback
    cb
  );
}

async.series(
  [createCategories, createItems],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    } else {
      console.log("Items:  " + items);
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
