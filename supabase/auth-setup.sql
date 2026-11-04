-- =====================================================================
-- Rumah Balon — Login karyawan (Google) & penguncian data (RLS)
-- Jalankan SEKALI di Supabase Dashboard → SQL Editor → New query → Run.
-- Aman dijalankan ulang (idempotent).
--
-- Hasil:
--   • Tabel rb_staff = daftar Gmail yang boleh masuk (admin / staff).
--   • diazkurniawanc@gmail.com selalu admin.
--   • rb_invoices, rb_inventory, rb_settings hanya bisa diakses akun terdaftar.
--   • Hapus data & ubah Settings Toko hanya untuk admin.
--   • Akses tanpa login (anon key saja) DITOLAK.
-- =====================================================================

-- 1. Daftar karyawan --------------------------------------------------
create table if not exists public.rb_staff (
  email       text primary key check (email = lower(email)),
  name        text not null default '',
  role        text not null default 'staff' check (role in ('admin', 'staff')),
  active      boolean not null default true,
  added_by    text,
  created_at  timestamptz not null default now()
);

insert into public.rb_staff (email, name, role, active, added_by)
values ('diazkurniawanc@gmail.com', 'Admin Rumah Balon', 'admin', true, 'setup')
on conflict (email) do update set role = 'admin', active = true;

-- 2. Peran user yang sedang login ('admin' | 'staff' | null) -----------
create or replace function public.rb_current_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when lower(coalesce(auth.jwt() ->> 'email', '')) = 'diazkurniawanc@gmail.com' then 'admin'
    else (
      select s.role from public.rb_staff s
      where s.email = lower(coalesce(auth.jwt() ->> 'email', ''))
        and s.active
    )
  end;
$$;

revoke all on function public.rb_current_role() from public, anon;
grant execute on function public.rb_current_role() to authenticated;

-- 3. Nyalakan RLS & hapus policy lama (termasuk policy "allow all" anon) --
alter table public.rb_staff     enable row level security;
alter table public.rb_invoices  enable row level security;
alter table public.rb_inventory enable row level security;
alter table public.rb_settings  enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname, tablename from pg_policies
    where schemaname = 'public'
      and tablename in ('rb_staff', 'rb_invoices', 'rb_inventory', 'rb_settings')
  loop
    execute format('drop policy %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- 4. Policy baru -------------------------------------------------------
-- Invoice: admin & staff boleh lihat/tambah/ubah, hapus hanya admin
create policy rb_invoices_select on public.rb_invoices for select to authenticated
  using (public.rb_current_role() in ('admin', 'staff'));
create policy rb_invoices_insert on public.rb_invoices for insert to authenticated
  with check (public.rb_current_role() in ('admin', 'staff'));
create policy rb_invoices_update on public.rb_invoices for update to authenticated
  using (public.rb_current_role() in ('admin', 'staff'))
  with check (public.rb_current_role() in ('admin', 'staff'));
create policy rb_invoices_delete on public.rb_invoices for delete to authenticated
  using (public.rb_current_role() = 'admin');

-- Stok: sama seperti invoice
create policy rb_inventory_select on public.rb_inventory for select to authenticated
  using (public.rb_current_role() in ('admin', 'staff'));
create policy rb_inventory_insert on public.rb_inventory for insert to authenticated
  with check (public.rb_current_role() in ('admin', 'staff'));
create policy rb_inventory_update on public.rb_inventory for update to authenticated
  using (public.rb_current_role() in ('admin', 'staff'))
  with check (public.rb_current_role() in ('admin', 'staff'));
create policy rb_inventory_delete on public.rb_inventory for delete to authenticated
  using (public.rb_current_role() = 'admin');

-- Settings toko: semua akun terdaftar boleh baca, ubah hanya admin
create policy rb_settings_select on public.rb_settings for select to authenticated
  using (public.rb_current_role() in ('admin', 'staff'));
create policy rb_settings_write on public.rb_settings for all to authenticated
  using (public.rb_current_role() = 'admin')
  with check (public.rb_current_role() = 'admin');

-- Daftar karyawan: tiap user boleh lihat datanya sendiri, admin kelola semua
create policy rb_staff_select on public.rb_staff for select to authenticated
  using (
    email = lower(coalesce(auth.jwt() ->> 'email', ''))
    or public.rb_current_role() = 'admin'
  );
create policy rb_staff_admin_write on public.rb_staff for all to authenticated
  using (public.rb_current_role() = 'admin')
  with check (public.rb_current_role() = 'admin');

-- 5. Cabut akses anon langsung ke tabel (lapisan pengaman tambahan) -----
revoke all on public.rb_staff, public.rb_invoices, public.rb_inventory, public.rb_settings from anon;
grant select, insert, update, delete on public.rb_staff, public.rb_invoices, public.rb_inventory, public.rb_settings to authenticated;
