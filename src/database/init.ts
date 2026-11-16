import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const uri: string = process.env.MONGO_URI || "mongodb://localhost:27017/cbtmcq";

export const initMongoose = async (): Promise<typeof mongoose> => {
  if (uri.length === 0) {
    throw new Error("MONGO_URI is not defined in environment variables.");
  }

  // Connection options compliant with Rule DDOS-005
  return mongoose.connect(uri, {
    maxPoolSize: 50,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 30000
  });
};
