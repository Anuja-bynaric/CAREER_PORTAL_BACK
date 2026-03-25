export interface LoginInput {
  emailAddress: string;
  password?: string; // Optional depending on your auth strategy
}

export interface UserApplication {
  jobTitle: string;
  appliedDate: string;
  status: string;
}

export interface UserResponse {
  name: string;
  email: string;
  phoneNumber: string; // Matches frontend 'formData.phoneNumber'
  skills: any;         // Matches frontend 'skills'
  savedResumeName: string | null;
  appliedJobIds: string[];
  applications: UserApplication[];
  role?: string;
}