const mongoose = require("mongoose");

const streamSchema = new mongoose.Schema({
    title: {type: String, required: true},
    user_id: {type: String, required: true},
    endpoint: {type: String, required: true},
    game_id: {type: String},
    is_live: {type: Boolean, required: true}
})

module.exports = mongoose.model("stream", streamSchema);