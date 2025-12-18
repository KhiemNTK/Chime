import api from "@/lib/axios";

export const authService = {
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
};
