export type Role = 'admin' | 'doctor' | 'patient';
export type PrescriptionStatus = 'pending' | 'consumed';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface UserProfile extends AuthUser {
  doctorId?: string;
  patientId?: string;
  specialty?: string;
  createdAt: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  dosage?: string | null;
  quantity?: number | null;
  instructions?: string | null;
}

export interface PrescriptionPatient {
  id: string;
  user: { name: string; email: string };
}

export interface PrescriptionAuthor {
  id: string;
  specialty?: string | null;
  user: { name: string; email: string };
}

export interface Prescription {
  id: string;
  code: string;
  status: PrescriptionStatus;
  notes?: string | null;
  createdAt: string;
  consumedAt?: string | null;
  patient: PrescriptionPatient;
  author: PrescriptionAuthor;
  items: PrescriptionItem[];
}

export interface Paginated<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientSearchResult {
  id: string;
  email: string;
  name: string;
  birthDate?: string | null;
}

export interface AdminMetrics {
  totals: {
    doctors: number;
    patients: number;
    prescriptions: number;
  };
  byStatus: {
    pending: number;
    consumed: number;
  };
  byDay: { date: string; count: number }[];
  topDoctors: {
    doctorId: string;
    name: string;
    specialty: string | null;
    count: number;
  }[];
}

export interface ApiError {
  message: string | string[];
  code: string;
  details?: unknown;
  path: string;
  timestamp: string;
}