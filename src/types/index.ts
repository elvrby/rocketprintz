export type UserRole = "admin" | "operator" | "supervisor";

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
}