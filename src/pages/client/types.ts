export type PayStatus = "Paid" | "Not Paid";

export type Client = {
  id: string;
  clientCode: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  phone?: string;
  email?: string;
};

export type NextDue = {
  tax: string;
  amount: number;
  date: string;
};

export type PaymentRecord = {
  id: string;
  date: string;
  description: string;
  amount: number;
  status: PayStatus;
};

export const TAX_TYPES = [
  "Income Tax",
  "Quarterly Tax",
  "GST/HST",
  "Other",
] as const;

export type LinkedCompanyRow = {
  id: string;
  name: string; // Person name (e.g., Carter)
  relationship: string; // father / mother / …
  company: string; // Carter & Sons
  taxDescription: string; // Payroll / Income Tax
  taxAmount: number; // 3000 -> $3,000
  dueDate: string; // YYYY-MM-DD
  status: PayStatus; // "Paid" | "Not Paid"
};

export type DocStatus =
  | "APPROVED"
  | "PENDING"
  | "APPROVAL REQUIRED"
  | "DUE"
  | "ESIGN REQUIRED";

export type DocAlert = "NOT REQUIRED" | "SENT" | "ALERTED" | "ALERT";

export type DocumentRow = {
  id: string; // DOC id
  date: string; // YYYY-MM-DD
  name: string; // "Tax Return"
  type: string; // "Payroll" or similar
  status: DocStatus;
  alert: DocAlert;
  via: "Mail" | "Phone" | "Message" | "Email" | "Portal" | "—";
  viewUrl?: string;
  downloadUrl?: string;
};

export type InvoiceStatus = "APPROVED" | "PENDING" | "DRAFT" | "OVERDUE";

export type InvoiceRow = {
  id: string; // Invoice ID (e.g., ID4523)
  date: string; // YYYY-MM-DD
  description: string; // e.g., "Tax for May"
  amount: number; // cents or whole dollars
  paid: PayStatus; // "Paid" | "Not Paid"
  status: InvoiceStatus;
};

export type CommChannel = "Email" | "Phone Call" | "Mail" | "Meeting";

export type CommunicationItem = {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  channel: CommChannel;
  note?: string;
  by?: string;
};
