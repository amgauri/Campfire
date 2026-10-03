const mongoose = require('mongoose');

// FOR PERSONAL AND GHOST DMs

const messageSchema = new mongoose.Schema({
    roomId: {   // every pair of 2 people chatting will be havin a unique roomID. 
        type: String, 
        required: true 
    },
    senderUserName: {
        type: String, 
        required: true,
    },
    receiverUserName: { 
        type: String, 
        required: true ,
    },
    text: { 
        type: String, // the data (message)
        required: true 
    },

    // FOR GHOST DM, SIMPLY DONT SHOW THE SENDER'S NAME IN FRONTEND.
    isRead: { type: Boolean, default: false }
}, { timestamps: true });

const messageModel = mongoose.model("message", messageSchema);

module.exports = messageModel;