'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Trash2, Loader2, ShieldCheck, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusPill } from '@/components/common/StatusPill';
import {
  ADMIN_EMAIL,
  StaffMember,
  StaffRole,
  listStaff,
  removeStaff,
  upsertStaff,
  useAuth,
} from '@/lib/auth';

interface StaffManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNotify: (message: string) => void;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const StaffManagerModal: React.FC<StaffManagerModalProps> = ({ isOpen, onClose, onNotify }) => {
  const { email: myEmail } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyEmail, setBusyEmail] = useState<string | null>(null);

  const [newEmail, setNewEmail] = useState('');
  const [newName, setNewName] = useState('');
  const [newRole, setNewRole] = useState<StaffRole>('staff');

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setStaff(await listStaff());
    } catch (e) {
      setError(
        e instanceof Error
          ? `Gagal memuat daftar karyawan: ${e.message}`
          : 'Gagal memuat daftar karyawan.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Load after the effect has run (not synchronously inside it)
    if (isOpen) queueMicrotask(refresh);
  }, [isOpen, refresh]);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = newEmail.trim().toLowerCase();
    if (!EMAIL_RE.test(email)) {
      setError('Format email tidak valid.');
      return;
    }
    if (staff.some((s) => s.email === email)) {
      setError('Email ini sudah terdaftar.');
      return;
    }
    setBusyEmail(email);
    setError(null);
    try {
      await upsertStaff({ email, name: newName.trim(), role: newRole, active: true, added_by: myEmail });
      setNewEmail('');
      setNewName('');
      setNewRole('staff');
      onNotify(`${email} sekarang bisa login ✅`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menambahkan karyawan.');
    } finally {
      setBusyEmail(null);
    }
  };

  const handleUpdate = async (member: StaffMember, patch: Partial<StaffMember>) => {
    setBusyEmail(member.email);
    setError(null);
    try {
      await upsertStaff({ ...member, ...patch });
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menyimpan perubahan.');
    } finally {
      setBusyEmail(null);
    }
  };

  const handleRemove = async (member: StaffMember) => {
    if (!confirm(`Hapus akses ${member.email}? Akun ini tidak akan bisa login lagi.`)) return;
    setBusyEmail(member.email);
    setError(null);
    try {
      await removeStaff(member.email);
      onNotify(`Akses ${member.email} dihapus.`);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal menghapus akses.');
    } finally {
      setBusyEmail(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-2xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl bg-card border border-border">
        <DialogHeader className="px-4 sm:px-6 pt-5 pb-4 border-b border-border">
          <DialogTitle className="text-base font-bold flex items-center gap-2 text-foreground">
            <span className="p-1.5 rounded-lg bg-[#4d3085]/10 text-[#4d3085] dark:text-[#c4b5fd]">
              <Users className="w-4 h-4" />
            </span>
            Kelola Karyawan
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            Hanya Gmail yang terdaftar di sini yang bisa login. Karyawan bisa membuat & mengubah invoice, jadwal,
            dan stok, tapi tidak bisa menghapus data, mengubah Settings Toko, atau Backup/Pulihkan.
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {/* Add form */}
          <form onSubmit={handleAdd} className="p-3 rounded-xl border border-border bg-muted/40 space-y-2.5">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              Tambah akses baru
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1.4fr_1fr] gap-2">
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nama.karyawan@gmail.com"
                aria-label="Email Gmail karyawan"
                required
                className="h-10 rounded-lg bg-card text-sm"
              />
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Nama (opsional)"
                aria-label="Nama karyawan"
                className="h-10 rounded-lg bg-card text-sm"
              />
            </div>
            <div className="flex items-center justify-between gap-2">
              <div role="radiogroup" aria-label="Peran" className="flex items-center bg-card p-0.5 rounded-lg border border-border">
                {(['staff', 'admin'] as StaffRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    role="radio"
                    aria-checked={newRole === r}
                    onClick={() => setNewRole(r)}
                    className={cn(
                      'h-8 px-3 rounded-md text-xs font-semibold cursor-pointer transition-colors',
                      newRole === r ? 'bg-[#4d3085] text-white' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    {r === 'staff' ? 'Karyawan' : 'Admin'}
                  </button>
                ))}
              </div>
              <Button
                type="submit"
                disabled={Boolean(busyEmail)}
                className="h-9 px-4 rounded-lg bg-[#f370a8] hover:bg-[#e85d98] text-white text-xs font-bold"
              >
                {busyEmail && busyEmail === newEmail.trim().toLowerCase() ? (
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4 mr-1.5" />
                )}
                Tambah
              </Button>
            </div>
          </form>

          {error && (
            <p role="alert" className="px-3 py-2 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-medium text-rose-700 dark:text-rose-300">
              {error}
            </p>
          )}

          {/* List */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Akun terdaftar ({staff.length})
              </span>
              <button
                type="button"
                onClick={refresh}
                aria-label="Muat ulang daftar"
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted cursor-pointer"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              </button>
            </div>

            {loading && staff.length === 0 ? (
              <div className="py-8 flex justify-center text-muted-foreground">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <ul className="divide-y divide-border rounded-xl border border-border overflow-hidden">
                {staff.map((m) => {
                  const isOwner = m.email === ADMIN_EMAIL;
                  const isMe = m.email === myEmail;
                  const locked = isOwner || isMe;
                  const busy = busyEmail === m.email;
                  return (
                    <li key={m.email} className={cn('flex flex-wrap sm:flex-nowrap items-center gap-x-3 gap-y-2 px-3 py-2.5 bg-card', !m.active && 'opacity-70')}>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#4d3085] to-[#f370a8] text-white text-[11px] font-bold flex items-center justify-center shrink-0">
                        {(m.name || m.email).slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0 basis-[calc(100%-2.75rem)] sm:basis-auto">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-bold text-foreground truncate">{m.name || m.email}</span>
                          {isOwner && <ShieldCheck className="w-3.5 h-3.5 text-[#4d3085] dark:text-[#c4b5fd] shrink-0" aria-label="Pemilik" />}
                          {isMe && <span className="text-[10px] text-muted-foreground shrink-0">(Anda)</span>}
                        </div>
                        {m.name && <div className="text-[11px] text-muted-foreground truncate">{m.email}</div>}
                      </div>

                      <div className="flex items-center gap-2 ml-11 sm:ml-0 shrink-0">
                      {locked ? (
                        <span className="h-6 px-2.5 inline-flex items-center rounded-full text-[11px] font-bold bg-[#4d3085] text-white">
                          {m.role === 'admin' ? 'Admin' : 'Karyawan'}
                        </span>
                      ) : (
                        <StatusPill
                          value={m.role}
                          options={[
                            { value: 'staff', label: 'Karyawan' },
                            { value: 'admin', label: 'Admin' },
                          ]}
                          onChange={(v) => handleUpdate(m, { role: v as StaffRole })}
                          badgeClassName={
                            m.role === 'admin'
                              ? 'bg-[#4d3085] text-white border-transparent'
                              : 'bg-muted text-foreground border-border'
                          }
                          ariaLabel={`Peran ${m.email}`}
                        />
                      )}

                      <button
                        type="button"
                        disabled={locked || busy}
                        onClick={() => handleUpdate(m, { active: !m.active })}
                        title={m.active ? 'Nonaktifkan sementara' : 'Aktifkan lagi'}
                        className={cn(
                          'h-6 px-2.5 rounded-full text-[11px] font-bold border cursor-pointer disabled:cursor-not-allowed disabled:opacity-60',
                          m.active
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                            : 'border-border bg-muted text-muted-foreground'
                        )}
                      >
                        {m.active ? 'Aktif' : 'Nonaktif'}
                      </button>

                      <button
                        type="button"
                        disabled={locked || busy}
                        onClick={() => handleRemove(m)}
                        aria-label={`Hapus akses ${m.email}`}
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-600 hover:bg-rose-500/10 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
