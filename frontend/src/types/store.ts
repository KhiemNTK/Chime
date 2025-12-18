export interface AuthState {
  accessToken: string | null;
  user: User | null;
  loading: boolean;

  signUp: (
    username: string,
    password: string,
    firstName: string,
    lastName: string,
    email: string
  ) => Promise<void>;
}
