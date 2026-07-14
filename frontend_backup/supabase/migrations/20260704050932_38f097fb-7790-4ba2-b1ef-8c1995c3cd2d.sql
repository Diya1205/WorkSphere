
-- Enum
create type public.app_role as enum ('admin','manager','employee');

-- profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  job_title text,
  department text,
  manager_id uuid references public.profiles(id) on delete set null,
  avatar_color text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- user_roles
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- has_role security definer
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- current_user_role
create or replace function public.current_user_role()
returns public.app_role language sql stable security definer set search_path = public as $$
  select role from public.user_roles where user_id = auth.uid()
  order by case role when 'admin' then 1 when 'manager' then 2 else 3 end
  limit 1
$$;

-- is_manager_of: is _manager the manager of _employee?
create or replace function public.is_manager_of(_manager uuid, _employee uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = _employee and manager_id = _manager)
$$;

-- Profiles policies
create policy "profiles: authenticated read all"
  on public.profiles for select to authenticated using (true);
create policy "profiles: self update"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "profiles: admin all"
  on public.profiles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));
create policy "profiles: insert self"
  on public.profiles for insert to authenticated with check (auth.uid() = id);

-- User roles policies
create policy "user_roles: read own or admin"
  on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_role(auth.uid(),'admin'));
create policy "user_roles: admin manage"
  on public.user_roles for all to authenticated
  using (public.has_role(auth.uid(),'admin'))
  with check (public.has_role(auth.uid(),'admin'));

-- Handle new user: create profile, assign role (first user = admin, else employee)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  is_first boolean;
  new_role public.app_role;
begin
  select not exists (select 1 from public.user_roles) into is_first;
  new_role := case when is_first then 'admin'::public.app_role else 'employee'::public.app_role end;

  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)), new.email)
  on conflict (id) do nothing;

  insert into public.user_roles (user_id, role) values (new.id, new_role)
  on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at helper
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Tasks
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references public.profiles(id) on delete set null,
  priority text not null default 'medium' check (priority in ('low','medium','high','urgent')),
  status text not null default 'pending' check (status in ('pending','in_progress','completed')),
  due_date date,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;

create trigger tasks_updated_at before update on public.tasks
  for each row execute function public.set_updated_at();

create policy "tasks: read scoped"
  on public.tasks for select to authenticated using (
    public.has_role(auth.uid(),'admin')
    or assignee_id = auth.uid()
    or created_by = auth.uid()
    or (public.has_role(auth.uid(),'manager') and public.is_manager_of(auth.uid(), assignee_id))
  );

create policy "tasks: insert scoped"
  on public.tasks for insert to authenticated with check (
    created_by = auth.uid() and (
      public.has_role(auth.uid(),'admin')
      or assignee_id = auth.uid()
      or (public.has_role(auth.uid(),'manager') and (assignee_id = auth.uid() or public.is_manager_of(auth.uid(), assignee_id)))
    )
  );

create policy "tasks: update scoped"
  on public.tasks for update to authenticated using (
    public.has_role(auth.uid(),'admin')
    or assignee_id = auth.uid()
    or created_by = auth.uid()
    or (public.has_role(auth.uid(),'manager') and public.is_manager_of(auth.uid(), assignee_id))
  );

create policy "tasks: delete scoped"
  on public.tasks for delete to authenticated using (
    public.has_role(auth.uid(),'admin')
    or created_by = auth.uid()
    or (public.has_role(auth.uid(),'manager') and public.is_manager_of(auth.uid(), assignee_id))
  );

-- Meetings
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  meeting_time time not null,
  link text,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.meetings to authenticated;
grant all on public.meetings to service_role;
alter table public.meetings enable row level security;

create trigger meetings_updated_at before update on public.meetings
  for each row execute function public.set_updated_at();

create table public.meeting_participants (
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (meeting_id, user_id)
);
grant select, insert, update, delete on public.meeting_participants to authenticated;
grant all on public.meeting_participants to service_role;
alter table public.meeting_participants enable row level security;

-- Helper: is user in meeting
create or replace function public.is_meeting_participant(_meeting uuid, _user uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.meeting_participants where meeting_id = _meeting and user_id = _user)
$$;

create policy "meetings: read scoped"
  on public.meetings for select to authenticated using (
    public.has_role(auth.uid(),'admin')
    or public.has_role(auth.uid(),'manager')
    or created_by = auth.uid()
    or public.is_meeting_participant(id, auth.uid())
  );

create policy "meetings: insert own"
  on public.meetings for insert to authenticated with check (created_by = auth.uid());

create policy "meetings: update by creator or admin"
  on public.meetings for update to authenticated using (
    created_by = auth.uid() or public.has_role(auth.uid(),'admin')
  );

create policy "meetings: delete by creator or admin"
  on public.meetings for delete to authenticated using (
    created_by = auth.uid() or public.has_role(auth.uid(),'admin')
  );

create policy "mp: read scoped"
  on public.meeting_participants for select to authenticated using (
    public.has_role(auth.uid(),'admin')
    or public.has_role(auth.uid(),'manager')
    or user_id = auth.uid()
    or exists (select 1 from public.meetings m where m.id = meeting_id and m.created_by = auth.uid())
  );

create policy "mp: manage by meeting owner or admin"
  on public.meeting_participants for all to authenticated
  using (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.meetings m where m.id = meeting_id and m.created_by = auth.uid())
  )
  with check (
    public.has_role(auth.uid(),'admin')
    or exists (select 1 from public.meetings m where m.id = meeting_id and m.created_by = auth.uid())
  );
