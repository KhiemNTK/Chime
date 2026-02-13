import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './libs/db.js';
import authRoute from './routes/authRoute.js';
import cookieParser from 'cookie-parser';
import userRoute from './routes/userRoute.js';
import friendRoute from './routes/friendRoute.js';
import { protectedRoute } from './middlewares/authMiddleware.js';
import cors from 'cors';
//import { commonLimiter } from './middlewares/rateLimiter.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

//middlewares
//app.set('trust proxy', 1); // trust first proxy
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true, methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']}));

//public routes
app.use('/api/auth', authRoute);

//private routes
app.use(protectedRoute);
app.use('/api/users', userRoute);
app.use('/api/friends', friendRoute);

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
