import api from "@/lib/axios";

export const authService = {
  //sign up method
  signUp: async (
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string
  ) => {
    const res = await api.post(
      "/auth/signup",
      { username, password, firstName, lastName, email },
      { withCredentials: true }
    );
    return res.data;
  },

  //sign in method
  signIn: async (
    username: string,
    password: string,
  ) => {
    const res = await api.post(
      "/auth/signin",
      { username, password},
      { withCredentials: true }
    );
    return res.data;
  },

  //signout method
  signOut: async () => {
    return api.post("/auth/signout", { withCredentials: true });
  }
};
