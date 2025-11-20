import { User } from './users';

export interface InvoiceTableRow {
  id: string;
  client: User;
  issueDate: {
    date: string;
    time: string;
  };
  status: 'sent' | 'paid' | 'late' | 'draft';
  paymentDate: string;
  requiredAmount: number;
  paidAmount: number;
}

export interface RecipientItem extends User {
  phone: string;
  location: string;
}

export interface InvoicePreviewItem {
  organizationImage: { id: number; file: any };
  invoiceFrom: {
    name: string;
    phone: string;
    email: string;
    address: string;
    issueDate: string;
  };
  invoiceTo: {
    name: string;
    phone: string;
    email: string;
    address: string;
    issueDate: string;
  };
  invoiceDetails: {
    invoiceNumber: number;
    status: string;
    amount: number;
  };
  shippingCost: number;
  discount: number;
  tax: number;
  itemDetails: {
    id: number;
    type: string;
    description: string;
    quantity: number;
    price: number;
  }[];
  note: string;
}

export interface InvoiceHistoryItem {
  id: number;
  date: string;
  companyName: string;
  message: string;
  image: string;
  email?: string;
  isLast?: boolean;
}
