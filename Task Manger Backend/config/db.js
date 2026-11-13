import config from "./env.js"
import mongoose from "mongoose";

const connectDB = async () => {
    await mongoose.connect(config.mongoUri);
    console.log("MongoDB connected");
}


export default connectDB;    