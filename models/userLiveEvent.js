const mongoose = require("mongoose");

const userEventSchema = new mongoose.Schema({
    name: {type: String, required: true},
    user_id: {type: String, required: true},
})

module.exports = mongoose.model("userEvent", userEventSchema);