export type InventoryCategory =
  | 'balon'
  | 'properti'
  | 'alat'
  | 'listrik'
  | 'aksesoris'
  | 'lainnya';

export type BalloonType = 'retro' | 'doff' | 'chrome' | 'metalik' | 'pastel';
export type BalloonSize = '5_inch' | '12_inch' | '18_inch' | '36_inch';

export type ItemCondition = 'baik' | 'perlu_cek' | 'rusak' | 'habis';

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  balloonType?: BalloonType | string;
  balloonSize?: BalloonSize | string;
  balloonColor?: string; // e.g. 'Sage Green', 'Rose Gold', 'White', 'Lilac'
  totalStock: number;
  availableStock?: number;
  unit: string; // 'Unit', 'Set', 'Pcs', 'Roll', 'Pack', 'Meter'
  condition: ItemCondition;
  location?: string; // e.g. 'Rak Properti A', 'Box Alat 1', 'Gudang Utama'
  notes?: string;
  minimumAlertStock?: number; // threshold warning jika stok <= minimumAlertStock
  createdAt?: string;
  updatedAt?: string;
}

export interface DispatchedProperty {
  id: string;
  inventoryItemId?: string;
  name: string;
  category?: string;
  balloonType?: string;
  balloonSize?: string;
  quantity: number;
  unit?: string;
  checkedOut?: boolean; // centang saat packing berangkat ke lokasi
  checkedIn?: boolean; // centang saat kembali ke gudang
  notes?: string;
}

export const BALLOON_TYPES: Array<{
  id: BalloonType;
  label: string;
  badge: string;
  dotColor: string;
}> = [
  {
    id: 'retro',
    label: 'Retro',
    badge: 'bg-amber-100 text-amber-900 dark:bg-amber-950/70 dark:text-amber-300 border-amber-300',
    dotColor: 'bg-[#92400e]',
  },
  {
    id: 'doff',
    label: 'Doff',
    badge: 'bg-sky-100 text-sky-900 dark:bg-sky-950/70 dark:text-sky-300 border-sky-300',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'chrome',
    label: 'Chrome',
    badge: 'bg-yellow-100 text-yellow-900 dark:bg-yellow-950/70 dark:text-yellow-300 border-yellow-400 font-extrabold',
    dotColor: 'bg-yellow-500',
  },
  {
    id: 'metalik',
    label: 'Metalik',
    badge: 'bg-purple-100 text-purple-900 dark:bg-purple-950/70 dark:text-purple-300 border-purple-300',
    dotColor: 'bg-purple-500',
  },
  {
    id: 'pastel',
    label: 'Pastel',
    badge: 'bg-pink-100 text-pink-900 dark:bg-pink-950/70 dark:text-pink-300 border-pink-300',
    dotColor: 'bg-pink-400',
  },
];

export const BALLOON_SIZES: Array<{
  id: BalloonSize;
  label: string;
  inch: number;
  badge: string;
}> = [
  {
    id: '5_inch',
    label: '5 Inch (Mini)',
    inch: 5,
    badge: 'bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300',
  },
  {
    id: '12_inch',
    label: '12 Inch (Standar)',
    inch: 12,
    badge: 'bg-indigo-50 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border-indigo-200 font-bold',
  },
  {
    id: '18_inch',
    label: '18 Inch (Medium)',
    inch: 18,
    badge: 'bg-purple-50 text-purple-800 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200 font-bold',
  },
  {
    id: '36_inch',
    label: '36 Inch (Jumbo)',
    inch: 36,
    badge: 'bg-rose-100 text-rose-900 dark:bg-rose-950/70 dark:text-rose-300 border-rose-300 font-black',
  },
];

export const INVENTORY_CATEGORIES: Array<{
  id: InventoryCategory;
  label: string;
  badge: string;
}> = [
  { id: 'balon', label: 'Balon & Latex', badge: 'bg-pink-100 text-pink-700 dark:bg-pink-950/70 dark:text-pink-300 border-pink-200' },
  { id: 'properti', label: 'Properti & Arch', badge: 'bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border-purple-200' },
  { id: 'alat', label: 'Alat & Mesin', badge: 'bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border-blue-200' },
  { id: 'listrik', label: 'Lampu & Listrik', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-950/70 dark:text-amber-300 border-amber-200' },
  { id: 'aksesoris', label: 'Aksesoris & Lem', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border-emerald-200' },
  { id: 'lainnya', label: 'Lainnya', badge: 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200' },
];

export const CONDITION_CONFIG: Record<
  ItemCondition,
  { label: string; badge: string; dot: string }
> = {
  baik: {
    label: 'Kondisi Baik',
    badge: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  perlu_cek: {
    label: 'Perlu Cek',
    badge: 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200',
    dot: 'bg-amber-500',
  },
  rusak: {
    label: 'Rusak / Servis',
    badge: 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200',
    dot: 'bg-rose-500',
  },
  habis: {
    label: 'Stok Habis',
    badge: 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300',
    dot: 'bg-zinc-500',
  },
};
