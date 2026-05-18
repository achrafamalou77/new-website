// Types file for the Visa Management module

export interface RequiredDocument {
  name: string;
  description: string;
  required: boolean;
  notes?: string;
}

export interface VisaType {
  id: string;
  agency_id: string;
  name: string;
  destination_country: string;
  category: 'Tourism' | 'Business' | 'Medical' | 'Umrah' | 'Student' | 'Transit';
  processing_time: string;
  validity: string;
  stay_duration: string;
  government_fee: number;
  service_fee: number;
  express_fee: number;
  application_method: 'Online' | 'Embassy' | 'On Arrival' | 'Agency';
  application_url?: string;
  biometric_required: boolean;
  interview_required: boolean;
  applicable_wilayas: number[]; // Array of 1 to 58
  documents_required: RequiredDocument[];
  special_notes?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentStatus {
  name: string;
  status: 'pending' | 'received' | 'rejected';
  received_at?: string;
  file_url?: string;
  notes?: string;
}

export interface VisaApplication {
  id: string;
  agency_id: string;
  client_id: string;
  visa_type_id: string | null;
  status: 'inquiry' | 'documents_pending' | 'documents_received' | 'application_submitted' | 'under_review' | 'approved' | 'rejected' | 'completed';
  service_level: 'standard' | 'express' | 'vip';
  assigned_to: string | null;
  
  // Group Visa Linking
  group_id?: string | null;
  group_name?: string | null;
  
  // Finances
  government_fee: number;
  service_fee: number;
  extra_fee: number;
  total_fee: number;
  amount_paid: number;
  payment_status: 'unpaid' | 'partial' | 'paid';
  
  // Dates
  appointment_date?: string | null;
  target_application_date?: string | null;
  decision_date?: string | null;
  expiry_date?: string | null;
  
  rejection_reason?: string | null;
  client_notes?: string | null;
  internal_notes?: string | null;
  documents_status: DocumentStatus[];
  
  created_at?: string;
  updated_at?: string;
}

export interface VisaPayment {
  id: string;
  application_id: string;
  amount: number;
  payment_method: 'CCP' | 'Edahabia' | 'Cash' | 'Bank Transfer' | 'Check';
  payment_date: string;
  reference_number?: string | null;
  receipt_url?: string | null;
  notes?: string | null;
  received_by?: string | null;
  created_at?: string;
}

export interface VisaTimelineEvent {
  id: string;
  application_id: string;
  event_type: string;
  title: string;
  description?: string | null;
  created_by?: string | null;
  is_internal: boolean;
  created_at?: string;
}

export interface EnhancedVisaApplication extends VisaApplication {
  client?: {
    id: string;
    full_name: string;
    email?: string;
    phone?: string;
    avatar_url?: string;
    cni_number?: string;
  } | null;
  visa_type?: VisaType | null;
  assignee?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  } | null;
}
