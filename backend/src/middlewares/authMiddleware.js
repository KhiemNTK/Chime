import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Middleware to protect routes and authenticate users
export const protectedRoute = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    //validate a valid token
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decodedUser) => {
      if (err) {
        return res.status(403).json({ message: 'Invalid token' });
      }

      //find user
      const user = await User.findById(decodedUser.userId).select('-hashedPassword');
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      //return user data except password
      req.user = user;
      next();
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
