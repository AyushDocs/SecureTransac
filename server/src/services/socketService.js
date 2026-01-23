const { Server } = require("socket.io");

class SocketService {
    constructor() {
        this.io = null;
    }

    init(server) {
        this.io = new Server(server, {
            cors: {
                origin: "*", // Adjust in production
                methods: ["GET", "POST"]
            }
        });

        this.io.on("connection", (socket) => {
            console.log(`[Socket] New connection: ${socket.id}`);
            
            socket.on("join", (room) => {
                socket.join(room);
                console.log(`[Socket] ${socket.id} joined room: ${room}`);
            });

            socket.on("disconnect", () => {
                console.log(`[Socket] Disconnected: ${socket.id}`);
            });
        });

        console.log("[Socket] WebSocket server initialized");
    }

    broadcast(event, data, room = null) {
        if (!this.io) return;
        if (room) {
            this.io.to(room).emit(event, data);
        } else {
            this.io.emit(event, data);
        }
    }
}

module.exports = new SocketService();
