-- Supabase Migration: 0007_employee_management_hr.sql
-- Create Employee Management, Custom Roles, Attendance, Leave, Payroll, Kanban Tasks, and Announcements tables

-- 1. Roles Table
CREATE TABLE IF NOT EXISTS public.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '[]'::jsonb, -- Array of string keys
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (agency_id, name)
);

-- Enable RLS on roles
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all agency users to view roles" ON public.roles;
CREATE POLICY "Allow all agency users to view roles"
  ON public.roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = roles.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow superadmins to manage roles" ON public.roles;
CREATE POLICY "Allow superadmins to manage roles"
  ON public.roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = roles.agency_id AND profiles.role = 'superadmin'
    )
  );

-- Pre-populate default roles helper function
CREATE OR REPLACE FUNCTION populate_default_roles(p_agency_id UUID)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.roles (agency_id, name, permissions) VALUES
    (p_agency_id, 'Superadmin', '["all"]'::jsonb),
    (p_agency_id, 'Manager', '["view_dashboard", "manage_inbox", "manage_clients", "manage_trips", "manage_bookings", "manage_invoices", "manage_team", "manage_settings"]'::jsonb),
    (p_agency_id, 'Sales Agent', '["view_dashboard", "manage_inbox", "manage_clients", "manage_bookings", "manage_invoices"]'::jsonb),
    (p_agency_id, 'Guide', '["view_dashboard", "view_trips", "view_bookings"]'::jsonb),
    (p_agency_id, 'Accountant', '["view_dashboard", "manage_invoices", "manage_payroll"]'::jsonb),
    (p_agency_id, 'Social Media', '["view_dashboard", "manage_inbox", "manage_announcements"]'::jsonb),
    (p_agency_id, 'Read Only', '["view_dashboard"]'::jsonb)
  ON CONFLICT (agency_id, name) DO NOTHING;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically populate roles when a new agency is created
CREATE OR REPLACE FUNCTION handle_new_agency_roles()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM populate_default_roles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_agency_created_roles ON public.agencies;
CREATE TRIGGER on_agency_created_roles
  AFTER INSERT ON public.agencies
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_agency_roles();

-- Run for existing agencies
DO $$
DECLARE
  v_agency RECORD;
BEGIN
  FOR v_agency IN SELECT id FROM public.agencies LOOP
    PERFORM populate_default_roles(v_agency.id);
  END LOOP;
END;
$$;


-- Helper to auto-generate employee code (EMP-001) per agency
CREATE OR REPLACE FUNCTION generate_employee_code(p_agency_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_next_num INTEGER;
  v_code TEXT;
BEGIN
  SELECT COALESCE(MAX(SUBSTRING(employee_code FROM '[0-9]+')::INTEGER), 0) + 1
  INTO v_next_num
  FROM public.employees
  WHERE agency_id = p_agency_id;
  
  v_code := 'EMP-' || LPAD(v_next_num::TEXT, 3, '0');
  RETURN v_code;
END;
$$ LANGUAGE plpgsql;


-- 2. Employees Table (extends profiles)
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  
  -- Personal
  date_of_birth DATE,
  place_of_birth TEXT,
  nationality TEXT DEFAULT 'Algerian',
  gender TEXT CHECK (gender IN ('male', 'female')),
  marital_status TEXT CHECK (marital_status IN ('single', 'married', 'divorced', 'widowed')),
  num_children INTEGER DEFAULT 0,
  
  -- Employment
  employee_code TEXT, -- like EMP-001
  department TEXT CHECK (department IN ('Sales', 'Operations', 'Finance', 'Marketing', 'Guides')),
  role TEXT, -- custom role name
  employment_type TEXT CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'intern')),
  hire_date DATE DEFAULT CURRENT_DATE,
  probation_end DATE,
  contract_end DATE,
  status TEXT CHECK (status IN ('active', 'on_leave', 'suspended', 'terminated', 'resigned')) DEFAULT 'active',
  
  -- Compensation
  base_salary INTEGER DEFAULT 40000, -- monthly DZD
  commission_percent DECIMAL(5,2) DEFAULT 0,
  commission_tier JSONB DEFAULT '{}'::jsonb,
  bonus_eligible BOOLEAN DEFAULT false,
  payment_method TEXT CHECK (payment_method IN ('ccp', 'bank_transfer', 'cash')) DEFAULT 'ccp',
  ccp_account TEXT,
  bank_account TEXT,
  bank_name TEXT,
  
  -- Work
  work_schedule JSONB DEFAULT '{"saturday": "09:00 - 18:00", "sunday": "09:00 - 18:00", "monday": "09:00 - 18:00", "tuesday": "09:00 - 18:00", "wednesday": "09:00 - 18:00", "thursday": "09:00 - 18:00", "friday": "Closed"}'::jsonb,
  branch_location TEXT,
  manager_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
  
  -- Documents
  id_card_front_url TEXT,
  id_card_back_url TEXT,
  passport_url TEXT,
  contract_url TEXT,
  certifications JSONB DEFAULT '[]'::jsonb,
  
  -- Emergency
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  emergency_contact_relation TEXT,
  
  -- Leave
  annual_leave_days INTEGER DEFAULT 30,
  sick_leave_days INTEGER DEFAULT 15,
  remaining_annual_leave INTEGER DEFAULT 30,
  remaining_sick_leave INTEGER DEFAULT 15,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS on employees
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow agency users to view employee directory" ON public.employees;
CREATE POLICY "Allow agency users to view employee directory"
  ON public.employees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = employees.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow superadmins and managers to manage employees" ON public.employees;
CREATE POLICY "Allow superadmins and managers to manage employees"
  ON public.employees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = employees.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );

-- Trigger to automatically create an employee entry when a profile is created
CREATE OR REPLACE FUNCTION public.handle_new_profile_employee()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.employees (
    id,
    agency_id,
    employee_code,
    status,
    nationality,
    annual_leave_days,
    sick_leave_days,
    remaining_annual_leave,
    remaining_sick_leave
  ) VALUES (
    NEW.id,
    NEW.agency_id,
    public.generate_employee_code(NEW.agency_id),
    'active',
    'Algerian',
    30,
    15,
    30,
    15
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_employee ON public.profiles;
CREATE TRIGGER on_profile_created_employee
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_profile_employee();

-- Backfill employees for existing profiles
DO $$
DECLARE
  v_profile RECORD;
BEGIN
  FOR v_profile IN SELECT id, agency_id FROM public.profiles LOOP
    INSERT INTO public.employees (id, agency_id, employee_code, status, nationality)
    VALUES (v_profile.id, v_profile.agency_id, public.generate_employee_code(v_profile.agency_id), 'active', 'Algerian')
    ON CONFLICT (id) DO NOTHING;
  END LOOP;
END;
$$;


-- 3. Attendance Table
CREATE TABLE IF NOT EXISTS public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'leave')) NOT NULL,
  check_in TIME,
  check_out TIME,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, date)
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view agency attendance" ON public.attendance;
CREATE POLICY "Allow members to view agency attendance"
  ON public.attendance FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = attendance.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow members to record attendance" ON public.attendance;
CREATE POLICY "Allow members to record attendance"
  ON public.attendance FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = attendance.agency_id
    )
  );


-- 4. Leaves Table
CREATE TABLE IF NOT EXISTS public.leaves (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  leave_type TEXT CHECK (leave_type IN ('annual', 'sick', 'hajj', 'other')) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reason TEXT,
  approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.leaves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view leaves" ON public.leaves;
CREATE POLICY "Allow members to view leaves"
  ON public.leaves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = leaves.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow managers or superadmins to approve leaves" ON public.leaves;
CREATE POLICY "Allow managers or superadmins to approve leaves"
  ON public.leaves FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = leaves.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );


-- 5. Payroll Table
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  employee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  month INTEGER CHECK (month >= 1 AND month <= 12) NOT NULL,
  year INTEGER NOT NULL,
  base_salary INTEGER NOT NULL,
  commission INTEGER DEFAULT 0,
  bonuses INTEGER DEFAULT 0,
  deductions INTEGER DEFAULT 0,
  net_salary INTEGER NOT NULL,
  status TEXT CHECK (status IN ('draft', 'paid')) DEFAULT 'draft',
  pdf_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (employee_id, month, year)
);

ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view their own payroll" ON public.payroll;
CREATE POLICY "Allow members to view their own payroll"
  ON public.payroll FOR SELECT
  USING (
    auth.uid() = employee_id OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = payroll.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );

DROP POLICY IF EXISTS "Allow superadmins to manage payroll" ON public.payroll;
CREATE POLICY "Allow superadmins to manage payroll"
  ON public.payroll FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = payroll.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );


-- 6. Kanban Tasks Table
CREATE TABLE IF NOT EXISTS public.hr_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT CHECK (status IN ('todo', 'in_progress', 'done', 'blocked')) DEFAULT 'todo',
  assignee_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.hr_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view Kanban tasks" ON public.hr_tasks;
CREATE POLICY "Allow members to view Kanban tasks"
  ON public.hr_tasks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = hr_tasks.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow members to manage Kanban tasks" ON public.hr_tasks;
CREATE POLICY "Allow members to manage Kanban tasks"
  ON public.hr_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = hr_tasks.agency_id
    )
  );


-- 7. Announcements Table
CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agency_id UUID REFERENCES public.agencies(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT false,
  read_by JSONB DEFAULT '[]'::jsonb, -- Array of profiles.id strings
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow members to view announcements" ON public.announcements;
CREATE POLICY "Allow members to view announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = announcements.agency_id
    )
  );

DROP POLICY IF EXISTS "Allow managers to publish announcements" ON public.announcements;
CREATE POLICY "Allow managers to publish announcements"
  ON public.announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() AND profiles.agency_id = announcements.agency_id AND profiles.role IN ('superadmin', 'manager')
    )
  );


-- Indexing for maximum performance
CREATE INDEX IF NOT EXISTS idx_roles_agency_id ON public.roles(agency_id);
CREATE INDEX IF NOT EXISTS idx_employees_agency_id ON public.employees(agency_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON public.attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_leaves_employee_id ON public.leaves(employee_id);
CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON public.payroll(employee_id);
CREATE INDEX IF NOT EXISTS idx_hr_tasks_agency_id ON public.hr_tasks(agency_id);
CREATE INDEX IF NOT EXISTS idx_announcements_agency_id ON public.announcements(agency_id);
