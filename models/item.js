let mongoose = require("mongoose");

let Schema = mongoose.Schema;

let ItemSchema = new Schema({
  name: { type: String, required: true, maxLength: 100 },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  price: { type: String, required: true },
  number_in_stock: { type: String, required: true },
});

// Virtual for author's URL
ItemSchema.virtual("url").get(function () {
  return "/catalog/item/" + this._id;
});

//Export model
module.exports = mongoose.model("Item", ItemSchema);
