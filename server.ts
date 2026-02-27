import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";

async function startServer() {
  const app = express();
  const PORT = 3000;
  const httpServer = createServer(app);
  
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
    },
  });

  // State
  let participants = 142;
  let unitsPresent = 118;

  io.on("connection", (socket) => {
    console.log("Client connected", socket.id);
    
    // Send initial state
    socket.emit("stats:update", { participants, unitsPresent });

    socket.on("checkin:new", () => {
      participants += 1;
      unitsPresent += 1;
      io.emit("stats:update", { participants, unitsPresent });
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected", socket.id);
    });
  });

  // API routes FIRST
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static("dist"));
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
