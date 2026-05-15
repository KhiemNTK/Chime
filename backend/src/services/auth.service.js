import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Session from '../models/Session.js';

const ACCESS_TOKEN_TTL = '30m'; // 30 minutes
const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60 * 1000; // 14 days in milliseconds

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const signUpService = async (userData) => {
  const { username, email, password, firstName, lastName } = userData;

  const duplicateUser = await User.exists({ username });
  if (duplicateUser) {
    throw new HttpError(409, 'Username already taken');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  await User.create({
    username,
    hashedPassword,
    email,
    displayName: `${firstName} ${lastName}`,
  });
};

export const signInService = async (username, password) => {
  const user = await User.findOne({ username }).lean();
  if (!user) {
    throw new HttpError(401, 'Invalid username or password');
  }

  const passwordMatch = await bcrypt.compare(password, user.hashedPassword);
  if (!passwordMatch) {
    throw new HttpError(401, 'Invalid username or password');
  }

  const accessToken = jwt.sign({ userId: user._id }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  const refreshToken = crypto.randomBytes(64).toString('hex');

  await Session.create({
    userId: user._id,
    refreshToken,
    expiresAt: new Date(Date.now() + REFRESH_TOKEN_TTL),
  });

  delete user.hashedPassword;

  return { user, accessToken, refreshToken, REFRESH_TOKEN_TTL };
};

export const signOutService = async (refreshToken) => {
  if (!refreshToken) return;
  await Session.deleteOne({ refreshToken });
};

export const refreshTokenService = async (refreshToken) => {
  if (!refreshToken) {
    throw new HttpError(401, 'Token not found');
  }

  const session = await Session.findOne({ refreshToken }).lean();
  if (!session) {
    throw new HttpError(403, 'Invalid refresh token');
  }

  if (new Date(session.expiresAt) < new Date()) {
    throw new HttpError(403, 'Refresh token expired');
  }

  const accessToken = jwt.sign({ userId: session.userId }, process.env.ACCESS_TOKEN_SECRET, {
    expiresIn: ACCESS_TOKEN_TTL,
  });

  return accessToken;
};
