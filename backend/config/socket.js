import { Server } from "socket.io"
import http from "http"
import express from "express"
import { socketAuthMiddleware } from "../middleware/socket.js"

const app = express()
const server = http.createServer(app)

// this is for storing online users
// Acts like a Phonebook
const userSocketMap = {}

const io = new Server(server, {
    cors: {
        origin: process.env.NODE_ENV ==='production'
            ? "https://ventura-connect.onrender.com" // false
            : "http://localhost:5173",
        methods: ["GET", "POST"],
        credentials: true
    },
    transports: ["websocket"]
})

// Apply authentication middleware to all socket connection
io.use(socketAuthMiddleware)

// this function is for checking if the user is online or not
export function getReceiverSocketId ( userId ){
    // You can remove the || [] only if you add a check before you try to use the result. There's a check in my sendMessage controller before the foreach loop.
    return userSocketMap[userId] || []
}

io.on("connection", (socket) => {
    console.log("A user connected:", socket.user.userName)

    const userId = socket.userId
    if (!userId) return;

    // Initialize the array if it doesn't exist, then add the new socketId
    if (!userSocketMap[userId]) {
        userSocketMap[userId] = [socket.id];
    } else {
        userSocketMap[userId].push(socket.id)
    }
    
    // io.emit() is used to send events to all connected clients
    io.emit("getOnlineUsers", Object.keys(userSocketMap))

    // with socket.on we listen for events from clients
    socket.on("disconnect", () => {
        console.log("A user disconnected", socket.user.userName)
        // Only proceed if we actually have this user in our map
        if (!userSocketMap[userId]) return
        // Remove ONLY the specific socketId that disconnected
        userSocketMap[userId] = userSocketMap[userId].filter(id => id !== socket.id);

        // Only delete the user from the map if they have NO tabs left open
        if (userSocketMap[userId]?.length === 0) {
            delete userSocketMap[userId];
        }
        
        io.emit("getOnlineUsers", Object.keys(userSocketMap))
    })
})

export { io, app, server }