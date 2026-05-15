import asyncHandler from 'express-async-handler';
import * as authService from '../services/auth.service.js';
import { signUpSchema, signInSchema } from '../validations/auth.validation.js';

export const signUp = asyncHandler(async (req, res) => {
  const validatedData = signUpSchema.parse(req.body);

  await authService.signUpService(validatedData);

  res.sendStatus(204);
});

export const signIn = asyncHandler(async (req, res) => {
  const validatedData = signInSchema.parse(req.body);

  const { user, accessToken, refreshToken, REFRESH_TOKEN_TTL } = await authService.signInService(
    validatedData.username,
    validatedData.password,
  );

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none',
    maxAge: REFRESH_TOKEN_TTL,
  });

  res.status(200).json({
    message: `User ${user.displayName} signed in successfully`,
    accessToken,
  });
});

export const signOut = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  await authService.signOutService(token);

  res.clearCookie('refreshToken');
  res.sendStatus(204);
});

export const refreshToken = asyncHandler(async (req, res) => {
  const token = req.cookies?.refreshToken;
  const accessToken = await authService.refreshTokenService(token);

  res.status(200).json({ accessToken });
});
