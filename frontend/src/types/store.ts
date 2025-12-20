import type { User } from "./user";
export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  clearState: () => void;
  signUp: (
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string
  ) => Promise<void>;

  signIn: (username: string, password: string) => Promise<void>;

  signOut:()=>Promise<void>;

}
