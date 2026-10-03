// THIS FILE HOLDS THE USER SCHEMA AND USER MODEL

require('dotenv').config();
const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    userName: {
        type: String,
        default: "",
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        
    },
    password: {
        type: String,
        default: ""
    },
    bio: {
        type: String,
        default: "",
    },
    profilePicture: {
        type: String,
        default: process.env.DEFAULT_PFP
    },
    followers: {
        // USED TO STORE THE USERNAME OF followers
        type: [String],
        default: [],
    },
    following: {
        type: [String],
        default: []
    },
    name: {
        type: String,
        default: ""
    },
    dms: {
        type: [String],
        default: []
    },
    matchingTime: {
        type: map,     // THIS STORES {matchedUser's userName : avg time matched in seconds (in random vid call) }
        of: Number,
        default: {}
    }
});

const userModel = mongoose.model("user", userSchema);

module.exports = userModel;