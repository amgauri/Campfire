const mongoose = require('mongoose');

// FOR THE GLOBAL FEED

const feedSchema = new mongoose.Schema({
    author: {
        type: String,  // USER_NAME OF UPLOADER
        required: true,
    },
    text: {
        type: [String],  // THE FIRST ELEMENT WILL BE THE TEXT (text[0] --> post title), AND SUBSEQUENT ELEMENTS WILL BE THE IMAGE URLs.
        required: true
    },
    likes: {
        type: Number,
        default: 0
    },
    reposts: {
        type: [String],  // Array of all the usernames who reposted this message
        default: []
    },
    comments: {
        type: map,
        of: [String],  // Each key will be a username, and the value will be comment of that very user.
        default: {} 
    },
    shares: {
        type: Number,
        default: 0
    }

}, {
    timestamps: true 
});

// We compile it into a model, and EXPORT THE MODEL itself
const feedModel = mongoose.model("globalMessage", feedSchema);

module.exports = feedModel;