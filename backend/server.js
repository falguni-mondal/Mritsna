import "dotenv/config";
import app from "./src/app.js";
import connectToDB from "./src/config/db.js";
import mongoose from "mongoose";

const PORT = process.env.PORT || 5000;

// 1. Initialize Database Connection
connectToDB()
  .then(() => {
    // 2. Start HTTP Server ONLY after DB is ready
    const server = app.listen(PORT, () => {
      console.log(`[Server] Mritsna API running on port ${PORT}`);
      console.log(`[Environment] ${process.env.NODE_ENV}`);
    }); 

    // 3. Graceful Shutdown Protocol
    const exitHandler = () => {
      if (server) {
        server.close(async () => {
          console.log("[Server] Closed remaining connections.");
          await mongoose.connection.close(false);
          console.log("[Database] Mongo connection securely closed.");
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    };

    process.on("SIGTERM", exitHandler);
    process.on("SIGINT", exitHandler);
  })
  .catch((err) => {
    console.error("[Server] Initialization failed:", err);
  });

// Catch rogue unhandled promises globally
process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection] Shutting down gracefully...");
  console.error(err.name, err.message);
  process.exit(1);
});