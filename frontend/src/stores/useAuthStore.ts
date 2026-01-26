import { create } from "zustand";
import { toast } from "sonner";
import { authService } from "@/services/authService";
import type { AuthState } from "@/types/store";
import { persist } from "zustand/middleware";

export const useAuthStore = create<AuthState>()(
  persist((set, get) => ({
    accessToken: null,
    user: null,
    loading: false,

    setAccessToken: (accessToken: string) => {
      set({ accessToken });
    },
    clearState: () => {
      set({ accessToken: null, user: null, loading: false });
      localStorage.clear();
      sessionStorage.clear();

    },

    signUp: async (username, password, firstName, lastName, email) => {
      try {
        set({ loading: true });
        //call API to sign up
        await authService.signUp(
          username,
          password,
          firstName,
          lastName,
          email,
        );
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
        get().clearState();
        set({ loading: true });
        //call API to sign up
        const { accessToken } = await authService.signIn(username, password);
        get().setAccessToken(accessToken);
        await get().fetchMe(); // get user info and set in store
        toast.success("Signed in successfully!");
      } catch (error) {
        console.error(error);
        toast.error("Invalid username or password");
      } finally {
        set({ loading: false });
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

    fetchMe: async () => {
      try {
        set({ loading: true });
        const user = await authService.fetchMe();

        set({ user });
      } catch (error) {
        console.error(error);
        set({ user: null, accessToken: null });
        toast.error("Error fetching user! Please try again.");
      } finally {
        set({ loading: false });
      }
    },

    refresh: async () => {
      try {
        set({ loading: true });
        const { user, fetchMe, setAccessToken } = get(); // get current user from store
        const accessToken = await authService.refresh();
        setAccessToken(accessToken);

        if (!user) {
          await fetchMe();
        }
      } catch (error) {
        console.error(error);
        //toast.error("Session expired! Please sign in again.");
        get().clearState();
      } finally {
        set({ loading: false });
      }
    },
  }), {
    name: "auth-storage", // name of the item in the storage (must be unique
    partialize: (state) => ({user: state.user }), // do not persist loading state
  }),
);
