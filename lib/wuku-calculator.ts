import wukuData from '@/wukuList.json';
import { calculateWuku, calculateWeton, formatWukuBullets } from './weton';

export interface WukuInfo {
  wuku: string;
  deskripsi?: string;
  kebaikan?: string;
  keburukan?: string;
  aralnya?: string;
  keris?: string[];
  sedekahSesaji?: string;
}

const WUKU_NAMES = [
  'Sinta','Landep','Wukir','Kulantir','Tolu','Gumbreg','Warigalit','Warigagung',
  'Julungwangi','Sungsang','Galungan','Kuningan','Langkir','Mandasiya','Julungpujud',
  'Pahang','Kuruwelut','Marakeh','Tambir','Madangkungan','Maktal','Wuye','Manahil',
  'Prangbakat','Bala','Wugu','Wayang','Kulawu','Dukut','Watugunung',
];

export function getCurrentWuku(date: Date = new Date()): { wuku: string; dayInWuku: number; wukuIndex: number } {
  const result = calculateWuku(date);
  const wukuIndex = WUKU_NAMES.findIndex((w) => w.toLowerCase() === result.name.toLowerCase());
  const dayInWuku = date.getDay() === 0 ? 7 : date.getDay(); // 1 (Senin) - 7 (Minggu) atau sesuai siklus
  return {
    wuku: result.name,
    dayInWuku,
    wukuIndex: wukuIndex >= 0 ? wukuIndex : 0,
  };
}

export function getWukuInfo(wukuName: string): WukuInfo | null {
  const data = wukuData as WukuInfo[];
  return data.find((w) => w.wuku?.toLowerCase() === wukuName.toLowerCase()) || null;
}

export function getWukuForDate(date: Date): { wuku: string; info: WukuInfo | null; dayInWuku: number } {
  const { wuku, dayInWuku } = getCurrentWuku(date);
  const info = getWukuInfo(wuku);
  return { wuku, info, dayInWuku };
}

export function getWukuCalendarMonth(year: number, month: number): Array<{ date: Date; wuku: string; dayInWuku: number }> {
  const daysInMonth = new Date(year, month, 0).getDate();
  const result = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const { wuku, dayInWuku } = getCurrentWuku(date);
    result.push({ date, wuku, dayInWuku });
  }
  return result;
}

export function getWetonHariIni(date: Date = new Date()): string {
  const res = calculateWeton(date);
  return res.wetonName;
}

export { formatWukuBullets };
