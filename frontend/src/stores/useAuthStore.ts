import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";

export const useAuthStore = create<AuthState>((set, get) => ({
  accessToken: null,
  user: null,
  loading: false,

  clearState: () => {
    set({ accessToken: null, user: null, loading: false });
  },

  signUp: async (username, password, firstName, lastName, email) => {
    try {
      set({ loading: true });
      //call API to sign up
      await authService.signUp(username, password, firstName, lastName, email);
      toast.success("Signed up successfully! Please log in.");
    } catch (error) {
      console.error(error);
      toast.error("Error signing up");
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (username, password) => {
    try {
      set({ loading: true });
      //call API to sign up
      const { accessToken } = await authService.signIn(username, password);
      set({ accessToken });
      toast.success("Signed in successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error signing in");
    }
  },

  signOut: async () => {
    try {
        get().clearState();
        await authService.signOut();
        toast.success("Signed out successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Error signing out! Try again.");
    }
  },
}));
