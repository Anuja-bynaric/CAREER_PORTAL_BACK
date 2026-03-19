export interface JobOpening {
  id: number;
  title: string;
  location: string;
  experience: string | null;
  jobType: string | null;
  category: string | null;
  description: string | null;
  requirements: string[] | null;
  responsibilities: string[] | null;
  about: string | null;
  createdAt: Date | null;
}