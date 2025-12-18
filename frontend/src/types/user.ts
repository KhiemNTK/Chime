import { create } from "zustand";
export interface User {
  _id: string;
  username: string;
  displayName: string;
  email: string;
  avaterUrl?: string;
  bio?: string;
  phoneNumber?: string;
  createdAt?: string;
  updatedAt?: string;
}
