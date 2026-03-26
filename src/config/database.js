import mongoose from "mongoose";
import config from "./config.js";

const connectToDB = async () => {
    try {
        await mongoose.connect(config.MONGO_URI)
        console.log("Database connected successfully🔒")
    } catch (error) {
        console.error("Error connecting to database", error)
    }
}

export default connectToDB