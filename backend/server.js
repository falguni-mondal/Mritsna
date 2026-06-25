import "dotenv/config";
import app from "./src/app.js";
import connectToDB from "./src/config/db.js";
import mongoose from "mongoose";
import initCurrencyUpdater from './src/cron/currencyUpdater.js'; // Assuming path based on earlier checks

const PORT = process.env.PORT || 5000;
let server; // Declare server outside so exitHandler can access it globally

// Graceful Shutdown Protocol
const exitHandler = () => {
  if (server) {
    server.close(async () => {
      console.log("[Server] Closed remaining HTTP connections.");
      try {
        await mongoose.connection.close(false);
        console.log("[Database] Mongo connection securely closed.");
      } catch (err) {
        console.error("[Database] Error while closing Mongo connection:", err);
      }
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

// Catch rogue unhandled promises globally and shut down SAFELY
process.on("unhandledRejection", (err) => {
  console.error("[Unhandled Rejection] Shutting down gracefully...");
  console.error(err.name, err.message);
  exitHandler(); // Route through your safe shutdown protocol!
});

process.on("uncaughtException", (err) => {
  console.error("[Uncaught Exception] Shutting down gracefully...");
  console.error(err.name, err.message);
  exitHandler();
});

// Initialize Database Connection
connectToDB()
  .then(() => {
    // Start HTTP Server ONLY after DB is ready
    server = app.listen(PORT, () => {
      console.log(`[Server] Mritsna API running on port ${PORT}`);
      console.log(`[Environment] ${process.env.NODE_ENV}`);
    }); 

    // Handle termination signals (Ctrl+C, Docker stop, Heroku restart)
    process.on("SIGTERM", () => {
      console.log("SIGTERM received");
      exitHandler();
    });
    process.on("SIGINT", () => {
      console.log("SIGINT received");
      exitHandler();
    });

    // Start background jobs safely after DB is connected
    initCurrencyUpdater();
  })
  .catch((err) => {
    console.error("[Server] Database Initialization failed:", err);
    process.exit(1);
  });