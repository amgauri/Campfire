// ALL THE SOCKET LOGIC GOES HERE

const { Server } = require('socket.io');

function initializeServer(server) {
    const io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST"]
        },
        pingTimeout: 60000,  // Wait 60 seconds before closing an unresponsive client
        pingInterval: 25000
    });

    // WHEN A USER CONNECTS
    io.on("connection", (socket) => {
        
        // USER JOINS THE SERVER
        socket.on("join_chat", (data) => {
            const { roomId } = data;
            socket.join(roomId);
        });

        // RECIEVE MESSAGE AND SEND IN THE ROOM
        socket.on("msg_to_server", async (data) => {
            // console.log("2. SERVER RECEIVED:", data.text);
            // Extract the exact keys we just set in the frontend
            const { roomId, senderUserName, receiverUserName, text } = data;

            // 1. Emit to the room (Frontend expects 'message', so we map 'text' to 'message')
            io.to(roomId).emit("msg_from_server", {
                message: text,
                senderUserName: senderUserName,

                roomId: roomId
            });

            await messageModel.create({
                roomId: roomId,
                senderUserName: senderUserName,
                receiverUserName: receiverUserName,
                text: text
            })
            try {
                // 2 Save to Mongoose and update balances concurrently to save network time
                await Promise.all([
                    userModel.findOneAndUpdate(
                        { userName: senderUserName },
                        { $inc: { aura: -2 } }
                    ),
                    // Task C: Increase aura for receiver
                    userModel.findOneAndUpdate(
                        { userName: receiverUserName },
                        { $inc: { aura: 10 } }
                    )
                ]);
                // console.log("All DB operations completed successfully in parallel.");
            } catch (err) {
                console.log("Database operation failed:", err);
            }
        });
    });
}

module.exports = { initializeServer };
