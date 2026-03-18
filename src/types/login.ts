export interface LoginInput {
  emailAddress: string;
  password?: string; // Optional depending on your auth strategy
}

export interface UserResponse {
  id: number;
  name: string;
  email: string;
  phone: string;
  savedResumeName: string | null;
}