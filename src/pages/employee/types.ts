export type EmpStatus = "Active" | "Inactive" | "Probation";

export type Employee = {
  id: string;
  avatarUrl?: string;
  firstName: string;
  lastName: string;
  gender?: "Male" | "Female" | "Other";
  role: string;
  department: string;
  email: string;
  phone: string;
  address?: string;
  dob?: string;
  status: EmpStatus;
  salary?: number;
  hireDate?: string;
  reportsTo?: string;
  joinedAgo?: string;
};

export type ProjectRow = {
  id: string;
  name: string;
  code: string;
  role: string;
  start: string;
  end?: string;
  status: "Active" | "Paused" | "Completed";
};

export type TaskRow = {
  id: string;
  title: string;
  due?: string;
  done: boolean;
  priority: "Low" | "Medium" | "High";
};

export const DEPARTMENTS = [
  "Engineering",
  "Operations",
  "Finance",
  "HR",
  "Sales",
  "Support",
] as const;

export const STATUS: EmpStatus[] = ["Active", "Inactive", "Probation"];
