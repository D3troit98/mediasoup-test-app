export interface User {
    _id: string;
    username: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
  }

  export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: User;
  }
