import mongoose from 'mongoose';
import dotenv from 'dotenv';

export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_CONNECTION_STRING);
        console.log("Connected to database successfully");
    } catch (error){
        console.log("Error connecting to database", error);
        process.exit(1);
    }
};