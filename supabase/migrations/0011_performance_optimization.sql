-- 0011_performance_optimization.sql
-- Add pg_trgm and btree_gin extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Core tables
CREATE INDEX IF NOT EXISTS idx_agencies_subdomain ON agencies(subdomain);
CREATE INDEX IF NOT EXISTS idx_profiles_agency_id ON profiles(agency_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Trips
CREATE INDEX IF NOT EXISTS idx_trips_agency_id ON trips(agency_id);
CREATE INDEX IF NOT EXISTS idx_trips_is_active ON trips(is_active);
CREATE INDEX IF NOT EXISTS idx_trips_destination_country ON trips(destination_country);
CREATE INDEX IF NOT EXISTS idx_trips_is_featured ON trips(is_featured);
CREATE INDEX IF NOT EXISTS idx_trips_agency_active ON trips(agency_id, is_active);
CREATE INDEX IF NOT EXISTS idx_trips_agency_featured ON trips(agency_id, is_featured);

-- Conversations / Inbox
CREATE INDEX IF NOT EXISTS idx_conversations_agency_id ON conversations(agency_id);
CREATE INDEX IF NOT EXISTS idx_conversations_customer_phone ON conversations(customer_phone);
CREATE INDEX IF NOT EXISTS idx_conversations_lead_score ON conversations(lead_score);
CREATE INDEX IF NOT EXISTS idx_conversations_platform ON conversations(platform);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message_at ON conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_score ON conversations(agency_id, lead_score);
CREATE INDEX IF NOT EXISTS idx_conversations_agency_platform ON conversations(agency_id, platform);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at DESC);

-- Bookings
CREATE INDEX IF NOT EXISTS idx_bookings_agency_id ON bookings(agency_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_trip_id ON bookings(trip_id);
CREATE INDEX IF NOT EXISTS idx_bookings_agency_status ON bookings(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- Clients
CREATE INDEX IF NOT EXISTS idx_clients_agency_id ON clients(agency_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_clients_source ON clients(source);
CREATE INDEX IF NOT EXISTS idx_clients_agency_source ON clients(agency_id, source);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at DESC);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_agency_id ON invoices(agency_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_agency_status ON invoices(agency_id, status);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(due_date);

-- Employees
CREATE INDEX IF NOT EXISTS idx_employees_agency_id ON employees(agency_id);
CREATE INDEX IF NOT EXISTS idx_employees_status ON employees(status);
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department);
CREATE INDEX IF NOT EXISTS idx_employees_manager_id ON employees(manager_id);
CREATE INDEX IF NOT EXISTS idx_employees_agency_status ON employees(agency_id, status);

-- Transactions / Finance
CREATE INDEX IF NOT EXISTS idx_transactions_agency_id ON transactions(agency_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_agency_date ON transactions(agency_id, transaction_date DESC);

-- Visa Applications
CREATE INDEX IF NOT EXISTS idx_visa_applications_agency_id ON visa_applications(agency_id);
CREATE INDEX IF NOT EXISTS idx_visa_applications_status ON visa_applications(status);
CREATE INDEX IF NOT EXISTS idx_visa_applications_client_id ON visa_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_visa_applications_agency_status ON visa_applications(agency_id, status);

-- HR and tasks
CREATE INDEX IF NOT EXISTS idx_hr_tasks_assignee_id ON public.hr_tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_agency_id ON public.leaves(agency_id);
CREATE INDEX IF NOT EXISTS idx_payroll_agency_id ON public.payroll(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_agency_id ON public.attendance(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON public.attendance(date);


-- Create function for dashboard stats
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_agency_id UUID)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalConversations', (SELECT COUNT(*) FROM conversations WHERE agency_id = p_agency_id),
    'hotLeads', (SELECT COUNT(*) FROM conversations WHERE agency_id = p_agency_id AND lead_score = 'HOT'),
    'bookingsThisMonth', (SELECT COUNT(*) FROM bookings WHERE agency_id = p_agency_id AND created_at >= DATE_TRUNC('month', NOW())),
    'tripsCount', (SELECT COUNT(*) FROM trips WHERE agency_id = p_agency_id),
    'invoicesCount', (SELECT COUNT(*) FROM invoices WHERE agency_id = p_agency_id),
    'accountsCount', (SELECT COUNT(*) FROM financial_accounts WHERE agency_id = p_agency_id),
    'faqsCount', (SELECT COUNT(*) FROM chatbot_faqs WHERE agency_id = p_agency_id),
    'visaApplicationsCount', (SELECT COUNT(*) FROM visa_applications WHERE agency_id = p_agency_id),
    'visaRevenue', (SELECT COALESCE(SUM(amount), 0) FROM visa_payments vp JOIN visa_applications va ON vp.application_id = va.id WHERE va.agency_id = p_agency_id)
  ) INTO result;
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
