
-- LEAVE REQUESTS
CREATE TABLE public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  leave_type TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  days NUMERIC(4,1) NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approver_id UUID REFERENCES auth.users(id),
  approver_comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.leave_requests TO authenticated;
GRANT ALL ON public.leave_requests TO service_role;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leave_select" ON public.leave_requests FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'manager') AND public.is_manager_of(auth.uid(), user_id))
);
CREATE POLICY "leave_insert_own" ON public.leave_requests FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);
CREATE POLICY "leave_update_manager_admin" ON public.leave_requests FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'manager') AND public.is_manager_of(auth.uid(), user_id))
  OR (auth.uid() = user_id AND status = 'pending')
);
CREATE POLICY "leave_delete_own_or_admin" ON public.leave_requests FOR DELETE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR (auth.uid() = user_id AND status = 'pending')
);

CREATE TRIGGER trg_leave_updated BEFORE UPDATE ON public.leave_requests
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ATTENDANCE
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','late','absent','leave','wfh')),
  location TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, date)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance TO authenticated;
GRANT ALL ON public.attendance TO service_role;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "att_select" ON public.attendance FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'manager') AND public.is_manager_of(auth.uid(), user_id))
);
CREATE POLICY "att_insert_own" ON public.attendance FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "att_update_own_or_admin" ON public.attendance FOR UPDATE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "att_delete_admin" ON public.attendance FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_att_updated BEFORE UPDATE ON public.attendance
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- SALARY
CREATE TABLE public.salary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  period DATE NOT NULL,
  basic NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','review','ready','paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, period)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.salary TO authenticated;
GRANT ALL ON public.salary TO service_role;
ALTER TABLE public.salary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sal_select" ON public.salary FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR (public.has_role(auth.uid(), 'manager') AND public.is_manager_of(auth.uid(), user_id))
);
CREATE POLICY "sal_insert_admin" ON public.salary FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sal_update_admin" ON public.salary FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "sal_delete_admin" ON public.salary FOR DELETE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_sal_updated BEFORE UPDATE ON public.salary
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
