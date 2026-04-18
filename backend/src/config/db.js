import mongoose from "mongoose";

const connectToDB = async () => {
  try {
    // Mongoose connection with standard recommended options
    const connectionInstance = await mongoose.connect(process.env.MONGO_URI);

    console.log(`[Database] Connected to MongoDB`);
    
    // Optional: Listen for connection drops after initial connection
    mongoose.connection.on("disconnected", () => {
      console.warn("[Database] Lost connection to MongoDB.");
    });

  } catch (error) {
    console.error("[Fatal Error] MongoDB connection failed.");
    console.error(error.message);
    // Exit process with failure. If DB fails, the server shouldn't run.
    process.exit(1); 
  }
};

export default connectToDB;