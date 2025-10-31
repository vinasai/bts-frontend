export type EmpStatus = "Active" | "Inactive" | "Probation";

export type StaffProfile = {
  id: string;
  userId: string | null;
  employeeId: string;
  firstName: string;
  lastName: string;
  username: string | null;
  email: string | null;
  isLogin: boolean;
  birthday: string | null;
  joiningDate: string | null;
  contactNumbers: string[];
  primaryContact: string | null;
  createdByName: string | null;
  updatedByName: string | null;
  role: string | null;
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
