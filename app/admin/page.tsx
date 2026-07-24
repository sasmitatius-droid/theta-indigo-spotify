'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Shield,
  Users,
  PieChart as PieChartIcon,
  Edit,
  Trash2,
  Crown,
  Package,
  Plus,
  Save,
  BookOpen,
  Send,
  UserCog,
  Sparkles,
  Image as ImageIcon,
  Download,
  Trash,
  RefreshCw,
  Check,
  CheckSquare,
  Square,
  Loader2,
  FileText,
  Video,
  Music,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DEFAULT_PACKAGE_PRESETS } from '@/lib/package-types';
import {
  type AdminPermissions,
  FULL_ADMIN_PERMISSIONS,
  DEFAULT_LIMITED_PERMISSIONS,
  canAccessTab,
} from '@/lib/admin-permissions';
import { resolveAdminAccess, ensureSuperAdminSetup } from '@/lib/admin-auth-client';
import { BLOG_CATEGORY_PRESETS, DEFAULT_BLOG_CATEGORY, formatBlogDateTime, nowIso } from '@/lib/blog-utils';
import { featuresToEditorText, parseFeaturesText } from '@/lib/parse-package-features';
import { TinyMceEditor } from '@/components/tinymce-editor';

interface UserData {
  id: string;
  name: string;
  email: string;
  subscription: string;
  analysisRemaining?: number | null;
}

interface AdminUserRecord {
  id: string;
  email: string;
  permissions: AdminPermissions;
}

type TabId = 'stats' | 'users' | 'packages' | 'blog' | 'admins' | 'media-ai';

export default function AdminPage() {

  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authError, setAuthError] = useState('');
  const [permissions, setPermissions] = useState<AdminPermissions>(FULL_ADMIN_PERMISSIONS);
  const [activeTab, setActiveTab] = useState<TabId>('users');

  const [users, setUsers] = useState<UserData[]>([]);
  const [packages, setPackages] = useState<Record<string, unknown>[]>([]);
  const [blogs, setBlogs] = useState<
    { id: string; title: string; content: string; category?: string; createdAt?: string }[]
  >([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);

  const [pieData, setPieData] = useState([
    { name: 'Gratis', value: 0, color: '#94a3b8' },
    { name: 'Premium', value: 0, color: '#eab308' },
  ]);
  const [statsData, setStatsData] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const [newBlogTitle, setNewBlogTitle] = useState('');
  const [newBlogCategory, setNewBlogCategory] = useState(DEFAULT_BLOG_CATEGORY);
  const [newBlogContent, setNewBlogContent] = useState('');
  const [blogPublishedAt, setBlogPublishedAt] = useState('');
  const [editingBlogId, setEditingBlogId] = useState<string | null>(null);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [blogCategoryOptions, setBlogCategoryOptions] = useState<string[]>([...BLOG_CATEGORY_PRESETS]);

  // Media & AI state variables
  const [mediaSubTab, setMediaSubTab] = useState<'generator' | 'r2'>('generator');
  const [autoBlogEnabled, setAutoBlogEnabled] = useState(true);
  const [isSavingAutoBlog, setIsSavingAutoBlog] = useState(false);
  const [isGeneratingCron, setIsGeneratingCron] = useState(false);

  // Manual Blog with Dynamic Banner state
  const [manualTitle, setManualTitle] = useState('');
  const [manualCategory, setManualCategory] = useState(DEFAULT_BLOG_CATEGORY);
  const [manualIcon, setManualIcon] = useState('📖');
  const [manualExcerpt, setManualExcerpt] = useState('');
  const [manualContent, setManualContent] = useState('');
  const [manualBgColor, setManualBgColor] = useState('1');
  const [isPublishingManual, setIsPublishingManual] = useState(false);

  // R2 Storage state
  const [r2Files, setR2Files] = useState<any[]>([]);
  const [r2Loading, setR2Loading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedR2Keys, setSelectedR2Keys] = useState<string[]>([]);

  const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
    const user = auth.currentUser;
    if (!user) throw new Error('User not logged in');
    const token = await user.getIdToken();
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setAuthError('');
      try {
        if (!user?.email) {
          router.push('/auth');
          return;
        }

        await ensureSuperAdminSetup(user);
        const access = await resolveAdminAccess(user);
        if (access.error) setAuthError(access.error);

        if (access.allowed) {
          setIsAuthorized(true);
          setPermissions(access.permissions);
          const firstTab: TabId[] = ['users', 'packages', 'blog', 'admins', 'media-ai'];
          const tab = firstTab.find((t) => canAccessTab(t, access.permissions)) || 'blog';
          setActiveTab(tab);
        } else {
          router.push('/dashboard');
        }
      } catch (err) {
        console.error('Admin auth error:', err);
        setAuthError('Gagal memverifikasi admin.');
        router.push('/dashboard');
      } finally {
        setIsCheckingAuth(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Helper function to fetch files from R2
  const fetchR2Files = async () => {
    setR2Loading(true);
    try {
      const res = await fetchWithAuth('/api/admin/r2/list');
      const data = await res.json();
      if (data.success) {
        setR2Files(data.files);
      } else {
        console.error('Failed to load R2 files:', data.error);
      }
    } catch (err) {
      console.error('Error fetching R2 files:', err);
    } finally {
      setR2Loading(false);
    }
  };

  // Toggle Auto Blog Generator status
  const handleToggleAutoBlog = async (enabled: boolean) => {
    setIsSavingAutoBlog(true);
    try {
      await fetchWithAuth('/api/admin/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'auto_blog', value: { enabled } }),
      });
      setAutoBlogEnabled(enabled);
    } catch (err) {
      console.error('Failed to update auto blog settings:', err);
      alert('Gagal memperbarui pengaturan otomatisasi.');
    } finally {
      setIsSavingAutoBlog(false);
    }
  };

  // Manually trigger the Cron generator
  const handleTriggerCron = async () => {
    if (isGeneratingCron) return;
    if (
      !confirm(
        'Picu generator AI sekarang? Ini akan membuat satu artikel otomatis menggunakan AI (dengan failover) dan membroadcast email ke seluruh pengguna.'
      )
    )
      return;

    setIsGeneratingCron(true);
    try {
      const res = await fetchWithAuth('/api/cron/generate-blog?manual=true', {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        alert(
          `Sukses!\nJudul: "${data.title}"\nKategori: ${data.category}\nAI Provider: ${data.provider}\nNewsletter Terkirim ke: ${data.newsletterBlastedCount} pengguna.`
        );
        // Refresh articles
        const blogsRes = await fetchWithAuth('/api/admin/blogs');
        const blogsData = await blogsRes.json();
        setBlogs(blogsData);
      } else {
        alert(`Gagal: ${data.error || 'Terjadi kesalahan saat generate.'}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    } finally {
      setIsGeneratingCron(false);
    }
  };

  // Publish a manual article with choice of dynamic banner bg and icon
  const handlePublishManual = async () => {
    if (!manualTitle.trim() || !manualContent.trim()) {
      alert('Judul dan isi artikel wajib diisi.');
      return;
    }
    setIsPublishingManual(true);
    try {
      const category = manualCategory.trim() || DEFAULT_BLOG_CATEGORY;
      const newPost = {
        title: manualTitle.trim(),
        category,
        icon: manualIcon.trim() || '📖',
        bg: manualBgColor,
        excerpt: manualExcerpt.trim() || manualTitle.trim().slice(0, 100),
        content: manualContent,
        published: true,
      };

      const res = await fetchWithAuth('/api/admin/blogs', {
        method: 'POST',
        body: JSON.stringify(newPost),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Request failed');

      alert('Artikel manual dengan banner dinamis berhasil dipublikasikan!');

      // Reset form
      setManualTitle('');
      setManualExcerpt('');
      setManualContent('');
      setManualIcon('📖');
      setManualBgColor('1');

      // Refresh list
      const blogsRes = await fetchWithAuth('/api/admin/blogs');
      const blogsData = await blogsRes.json();
      setBlogs(blogsData);
    } catch (err: any) {
      alert(`Gagal menerbitkan artikel: ${err.message}`);
    } finally {
      setIsPublishingManual(false);
    }
  };

  // Upload file to Cloudflare R2
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');
      const token = await user.getIdToken();

      const res = await fetch('/api/admin/r2/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        alert('File berhasil diunggah ke Cloudflare R2!');
        fetchR2Files();
      } else {
        alert(`Gagal mengunggah file: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan upload: ${err.message}`);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  // Download a single file securely using presigned URL
  const handleDownloadFile = async (key: string) => {
    try {
      const res = await fetchWithAuth(`/api/admin/r2/presign?key=${encodeURIComponent(key)}`);
      const data = await res.json();
      if (data.success && data.url) {
        const a = document.createElement('a');
        a.href = data.url;
        a.download = key.replace(/^\d+-/, '');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      } else {
        alert(`Gagal membuat secure link download: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    }
  };

  // Delete single or multiple files from R2
  const handleDeleteFiles = async (keys: string[]) => {
    if (!confirm(`Hapus ${keys.length} file terpilih selamanya dari Cloudflare R2?`)) return;

    try {
      const res = await fetchWithAuth('/api/admin/r2/delete', {
        method: 'POST',
        body: JSON.stringify({ keys }),
      });
      const data = await res.json();
      if (data.success) {
        alert(data.message);
        setSelectedR2Keys([]);
        fetchR2Files();
      } else {
        alert(`Gagal menghapus: ${data.error}`);
      }
    } catch (err: any) {
      alert(`Terjadi kesalahan: ${err.message}`);
    }
  };

  // Bulk download selected files sequentially
  const handleBulkDownload = async () => {
    if (selectedR2Keys.length === 0) return;
    for (let i = 0; i < selectedR2Keys.length; i++) {
      const key = selectedR2Keys[i];
      try {
        const res = await fetchWithAuth(`/api/admin/r2/presign?key=${encodeURIComponent(key)}`);
        const data = await res.json();
        if (data.success && data.url) {
          const a = document.createElement('a');
          a.href = data.url;
          a.download = key.replace(/^\d+-/, '');
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          // Wait 500ms between downloads to avoid browser block
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`Gagal mengunduh berkas ${key}:`, err);
      }
    }
  };

  useEffect(() => {
    if (!isAuthorized) return;

    if (activeTab === 'users' && (permissions.manageUsers || permissions.manageSubscriptions)) {
      fetchWithAuth('/api/admin/users')
        .then((res) => res.json())
        .then((fetchedUsers) => {
          let freeCount = 0;
          let premiumCount = 0;
          fetchedUsers.forEach((user: any) => {
            const sub = user.subscription || 'Tidak Ada';
            if (sub === 'Tidak Ada') freeCount++;
            else premiumCount++;
          });
          setUsers(fetchedUsers);
          setPieData([
            { name: 'Gratis', value: freeCount, color: '#94a3b8' },
            { name: 'Premium', value: premiumCount, color: '#eab308' },
          ]);
        })
        .catch((e) => console.error('users:', e));
    } else if (activeTab === 'packages' && permissions.managePackages) {
      fetchWithAuth('/api/admin/packages')
        .then((res) => res.json())
        .then((data) => setPackages(data))
        .catch((e) => console.error('packages:', e));
    } else if (activeTab === 'blog' && permissions.manageBlog) {
      fetchWithAuth('/api/admin/blogs')
        .then((res) => res.json())
        .then((loaded) => {
          setBlogs(loaded);
          const cats = new Set<string>([...BLOG_CATEGORY_PRESETS]);
          loaded.forEach((b: any) => {
            if (b.category) cats.add(String(b.category));
          });
          setBlogCategoryOptions(Array.from(cats).sort((a, b) => a.localeCompare(b, 'id')));
        })
        .catch((e) => console.error('blogs:', e));
    } else if (activeTab === 'media-ai' && permissions.manageBlog) {
      fetchWithAuth('/api/admin/settings?key=auto_blog')
        .then((res) => res.json())
        .then((data) => {
          setAutoBlogEnabled(data.value?.enabled !== false);
        })
        .catch((e) => console.error('Error loading settings/auto_blog:', e));

      fetchR2Files();
    } else if (activeTab === 'stats') {
      setStatsLoading(true);
      fetchWithAuth('/api/admin/stats')
        .then((res) => res.json())
        .then((data) => setStatsData(data))
        .catch((e) => console.error('stats:', e))
        .finally(() => setStatsLoading(false));
    } else if (activeTab === 'admins' && permissions.manageAdmins) {
      fetchWithAuth('/api/admin/admins')
        .then((res) => res.json())
        .then((data) => setAdminUsers(data))
        .catch((e) => console.error('admins:', e));
    }
  }, [isAuthorized, activeTab, permissions]);

  const handleEditUser = async (id: string, currentName: string) => {
    const newName = prompt('Masukkan nama baru pengguna:', currentName);
    if (newName && newName !== currentName) {
      await fetchWithAuth(`/api/admin/users/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ name: newName }),
      });
      setUsers(users.map((u) => (u.id === id ? { ...u, name: newName } : u)));
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (confirm('Yakin ingin menghapus pengguna ini?')) {
      await fetchWithAuth(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });
      setUsers(users.filter((u) => u.id !== id));
    }
  };

  const handleManualSubscribe = async (id: string) => {
    const pkg = prompt('Nama paket langganan (contoh: Paket Bulanan / Master Spiritual):', 'Premium (Manual)');
    if (!pkg) return;
    const daysStr = prompt('Masa berlaku dalam hari (contoh: 30 / 365, kosongkan untuk selamanya):', '30');
    const quotaStr = prompt('Kuota analisis (contoh: 10, 50, atau kosongkan untuk unlimited):', '');
    const unlimited = !quotaStr?.trim();
    const quota = unlimited ? null : Number(quotaStr) || 10;
    const durationDays = daysStr?.trim() ? Number(daysStr) || 30 : null;

    try {
      const res = await fetchWithAuth('/api/admin/users/grant-premium', {
        method: 'POST',
        body: JSON.stringify({
          userId: id,
          packageName: pkg,
          durationDays,
          quota,
          unlimited,
        }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Berhasil memberikan paket "${pkg}" ke user.`);
        setUsers(users.map((u) => (u.id === id ? { ...u, subscription: pkg } : u)));
      } else {
        alert(`Gagal: ${data.error}`);
      }
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleLimitSubscription = async (id: string) => {
    if (confirm('Batalkan langganan pengguna ini?')) {
      await fetchWithAuth('/api/admin/users/update-package', {
        method: 'POST',
        body: JSON.stringify({
          userId: id,
          subscription: 'Tidak Ada',
          analysisRemaining: 0,
          analysisUnlimited: false,
          packageId: null,
        }),
      });
      setUsers(users.map((u) => (u.id === id ? { ...u, subscription: 'Tidak Ada' } : u)));
    }
  };

  const handleGrantUnlimitedAnalysis = async (id: string) => {
    if (confirm('Berikan kuota analisis UNLIMITED untuk pengguna ini?')) {
      await fetchWithAuth('/api/admin/users/update-package', {
        method: 'POST',
        body: JSON.stringify({
          userId: id,
          subscription: 'Unlimited (Manual)',
          analysisUnlimited: true,
          analysisRemaining: null,
        }),
      });
      setUsers(users.map((u) => (u.id === id ? { ...u, subscription: 'Unlimited (Manual)', analysisRemaining: null } : u)));
    }
  };

  const handleAddPackage = async () => {
    const preset = DEFAULT_PACKAGE_PRESETS[0];
    const newPkg = {
      name: preset.name,
      price: preset.price,
      analysisQuota: preset.analysisQuota,
      durationDays: preset.durationDays,
      unlimited: preset.unlimited ?? false,
      features: preset.features,
    };
    const res = await fetchWithAuth('/api/admin/packages', {
      method: 'POST',
      body: JSON.stringify(newPkg),
    });
    const data = await res.json();
    setPackages([...packages, { id: data.id, ...newPkg }]);
  };

  const handleSeedPackages = async () => {
    if (!confirm('Tambahkan paket default (25rb/50rb/100rb/250rb) ke D1?')) return;
    for (const preset of DEFAULT_PACKAGE_PRESETS) {
      await fetchWithAuth('/api/admin/packages', {
        method: 'POST',
        body: JSON.stringify({
          ...preset,
          unlimited: preset.unlimited ?? preset.analysisQuota === null,
        }),
      });
    }
    const res = await fetchWithAuth('/api/admin/packages');
    const data = await res.json();
    setPackages(data);
    alert('Paket default berhasil ditambahkan.');
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm('Hapus paket ini?')) {
      await fetchWithAuth(`/api/admin/packages/${id}`, {
        method: 'DELETE',
      });
      setPackages(packages.filter((p) => p.id !== id));
    }
  };

  const updatePackageState = (id: string, field: string, value: unknown) => {
    setPackages(packages.map((p) => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSavePackage = async (pkg: Record<string, unknown>) => {
    const unlimited = Boolean(pkg.unlimited) || pkg.analysisQuota === '' || pkg.analysisQuota === null;
    await fetchWithAuth(`/api/admin/packages/${pkg.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        name: pkg.name,
        price: Number(pkg.price),
        analysisQuota: unlimited ? null : Number(pkg.analysisQuota),
        durationDays: Number(pkg.durationDays) || 30,
        unlimited,
        features:
          typeof pkg.features === 'string'
            ? parseFeaturesText(String(pkg.features))
            : pkg.features,
      }),
    });
    alert('Paket disimpan.');
  };

  const resetBlogForm = () => {
    setNewBlogTitle('');
    setNewBlogCategory(DEFAULT_BLOG_CATEGORY);
    setNewBlogContent('');
    setBlogPublishedAt('');
    setEditingBlogId(null);
  };

  const handlePublishBlog = async () => {
    if (!newBlogTitle.trim() || !newBlogContent.trim()) {
      alert('Judul dan konten wajib diisi.');
      return;
    }
    try {
      const category = newBlogCategory.trim() || DEFAULT_BLOG_CATEGORY;
      if (editingBlogId) {
        await fetchWithAuth(`/api/admin/blogs/${editingBlogId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: newBlogTitle.trim(),
            category,
            content: newBlogContent,
            published: true,
          }),
        });
        setBlogs(
          blogs.map((b) =>
            b.id === editingBlogId
              ? { ...b, title: newBlogTitle.trim(), content: newBlogContent, category }
              : b,
          ),
        );
        alert('Artikel diperbarui.');
      } else {
        const res = await fetchWithAuth('/api/admin/blogs', {
          method: 'POST',
          body: JSON.stringify({
            title: newBlogTitle.trim(),
            category,
            content: newBlogContent,
            published: true,
          }),
        });
        const data = await res.json();
        setBlogs([{ id: data.id, title: newBlogTitle.trim(), content: newBlogContent, category, createdAt: new Date().toISOString() }, ...blogs]);
        alert('Artikel dipublikasikan.');
      }
      resetBlogForm();
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan artikel.');
    }
  };

  const handleEditBlog = async (blog: {
    id: string;
    title: string;
    content: string;
    category?: string;
    createdAt?: string;
  }) => {
    try {
      const res = await fetchWithAuth(`/api/admin/blogs/${blog.id}`);
      const fullBlog = await res.json();
      setEditingBlogId(fullBlog.id);
      setNewBlogTitle(fullBlog.title);
      setNewBlogCategory(fullBlog.category || DEFAULT_BLOG_CATEGORY);
      setNewBlogContent(fullBlog.content);
      setBlogPublishedAt(formatBlogDateTime(fullBlog.createdAt));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Failed to load full blog post details:', err);
      alert('Gagal mengambil data lengkap artikel.');
    }
  };

  const handleDeleteBlog = async (id: string) => {
    if (confirm('Hapus artikel?')) {
      await fetchWithAuth(`/api/admin/blogs/${id}`, {
        method: 'DELETE',
      });
      setBlogs(blogs.filter((b) => b.id !== id));
    }
  };

  const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
    manageUsers: 'Kelola Pengguna & Kuota',
    managePackages: 'Kelola Paket Langganan',
    manageBlog: 'Kelola Blog & Media AI',
    manageAdmins: 'Kelola Admin & Hak Akses',
    manageSubscriptions: 'Kelola Transaksi & Pembayaran',
  };

  const handleAddAdmin = async (isFullAdmin: boolean = true) => {
    const email = newAdminEmail.trim().toLowerCase();
    if (!email.includes('@')) {
      alert('Email tidak valid.');
      return;
    }
    await fetchWithAuth('/api/admin/admins', {
      method: 'POST',
      body: JSON.stringify({ email, isFullAdmin }),
    });
    setNewAdminEmail('');
    const res = await fetchWithAuth('/api/admin/admins');
    const data = await res.json();
    setAdminUsers(data);
  };

  const handleMakeFullAdmin = (id: string) => {
    setAdminUsers(
      adminUsers.map((a) =>
        a.id === id
          ? {
              ...a,
              permissions: {
                manageUsers: true,
                managePackages: true,
                manageBlog: true,
                manageAdmins: true,
                manageSubscriptions: true,
              },
            }
          : a,
      ),
    );
  };

  const handleDeleteAdmin = async (id: string) => {
    if (confirm('Hapus admin ini?')) {
      await fetchWithAuth(`/api/admin/admins/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      setAdminUsers(adminUsers.filter((a) => a.id !== id));
    }
  };

  const toggleAdminPermission = (id: string, key: keyof AdminPermissions) => {
    setAdminUsers(
      adminUsers.map((a) =>
        a.id === id ? { ...a, permissions: { ...a.permissions, [key]: !a.permissions[key] } } : a,
      ),
    );
  };

  const saveAdminPermissions = async (admin: AdminUserRecord) => {
    await fetchWithAuth(`/api/admin/admins/${encodeURIComponent(admin.id)}`, {
      method: 'PUT',
      body: JSON.stringify({ permissions: admin.permissions }),
    });
    alert('Hak akses admin disimpan.');
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center font-semibold gap-3 px-4 text-center">
        <p>Memeriksa otorisasi...</p>
        {authError && <p className="text-amber-300 text-sm font-normal max-w-md">{authError}</p>}
      </div>
    );
  }
  if (!isAuthorized) return null;

  const navItems: { id: TabId; label: string; icon: any }[] = [
    { id: 'stats', label: '📊 Statistik & Analitik', icon: PieChartIcon },
    { id: 'users', label: 'Pengguna', icon: Users },
    { id: 'packages', label: 'Kelola Paket', icon: Package },
    { id: 'blog', label: 'Blog', icon: BookOpen },
    { id: 'media-ai', label: 'Media & AI', icon: Sparkles },
    { id: 'admins', label: 'Admin & Hak Akses', icon: UserCog },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col md:flex-row p-4 md:p-8 gap-6">
      <aside className="w-full md:w-72 bg-slate-900 border border-indigo-500/20 p-6 rounded-2xl flex flex-col">
        <div className="flex items-center gap-3 mb-8">
          <Shield className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold">Admin Panel</h1>
        </div>
        <nav className="space-y-2 flex-1">
          {navItems.map((item) =>
            canAccessTab(item.id, permissions) ? (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === item.id ? 'bg-indigo-600' : 'hover:bg-indigo-500/20'}`}
              >
                <item.icon className="w-5 h-5" /> {item.label}
              </button>
            ) : null,
          )}
        </nav>
        <div className="mt-8 pt-6 border-t border-slate-700">
          <Link href="/" className="text-gray-400 hover:text-white transition-colors">
            <div className="flex items-center gap-3 px-4 py-3">
              <ArrowLeft className="w-5 h-5" /> Landing Page
            </div>
          </Link>
        </div>
      </aside>

      <main className="flex-1 space-y-6">
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-indigo-900 to-slate-900 border-indigo-500/20 text-white">
                <CardContent className="pt-6">
                  <p className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Total Artikel</p>
                  <p className="text-3xl font-extrabold mt-1">{statsLoading ? '...' : statsData?.totalBlogs || 0}</p>
                  <p className="text-xs text-indigo-400 mt-1">Hari ini: +{statsData?.blogsToday || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-purple-900 to-slate-900 border-purple-500/20 text-white">
                <CardContent className="pt-6">
                  <p className="text-xs text-purple-300 font-semibold uppercase tracking-wider">Total Pengguna</p>
                  <p className="text-3xl font-extrabold mt-1">{statsLoading ? '...' : statsData?.totalUsers || 0}</p>
                  <p className="text-xs text-purple-400 mt-1">Premium: {statsData?.premiumUsers || 0}</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-emerald-900 to-slate-900 border-emerald-500/20 text-white">
                <CardContent className="pt-6">
                  <p className="text-xs text-emerald-300 font-semibold uppercase tracking-wider">Total Pendapatan</p>
                  <p className="text-3xl font-extrabold mt-1">Rp{(statsData?.totalRevenue || 0).toLocaleString('id-ID')}</p>
                  <p className="text-xs text-emerald-400 mt-1">Dari Midtrans</p>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-amber-900 to-slate-900 border-amber-500/20 text-white">
                <CardContent className="pt-6">
                  <p className="text-xs text-amber-300 font-semibold uppercase tracking-wider">Cron 7 Hari</p>
                  <p className="text-3xl font-extrabold mt-1">{statsLoading ? '...' : statsData?.cronActivity?.reduce((a: number, b: any) => a + (b.count || 0), 0) || 0}</p>
                  <p className="text-xs text-amber-400 mt-1">Artikel digenerate</p>
                </CardContent>
              </Card>
            </div>

            {/* Articles per Category & 10 Recent Articles */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-900">Artikel per Kategori</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statsData?.blogsPerCategory?.map((cat: any) => (
                    <div key={cat.category} className="flex items-center justify-between text-sm py-1 border-b border-gray-100">
                      <span className="font-medium text-gray-800">{cat.category}</span>
                      <span className="bg-indigo-100 text-indigo-800 text-xs font-bold px-2.5 py-0.5 rounded-full">{cat.count} artikel</span>
                    </div>
                  ))}
                  {(!statsData?.blogsPerCategory || statsData.blogsPerCategory.length === 0) && (
                    <p className="text-gray-400 text-sm py-4 text-center">Belum ada data artikel.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-white border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-indigo-900">10 Artikel Terbaru &amp; Views</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {statsData?.recentBlogs?.map((blog: any) => (
                    <div key={blog.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-100">
                      <div className="truncate pr-2">
                        <p className="font-medium text-gray-900 truncate">{blog.title}</p>
                        <p className="text-xs text-gray-400">{blog.category} · {blog.generatorSource || 'Manual'}</p>
                      </div>
                      <span className="text-xs text-gray-500 font-mono whitespace-nowrap">👁️ {blog.views || 0}</span>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Active Premium Users */}
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg text-indigo-900">Daftar Pengguna Premium Aktif</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b text-gray-600">
                        <th className="p-3">Nama</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Paket</th>
                        <th className="p-3">Kadaluwarsa</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statsData?.premiumUsersList?.map((u: any) => (
                        <tr key={u.id} className="border-b hover:bg-gray-50 text-gray-800">
                          <td className="p-3 font-medium">{u.name || 'User'}</td>
                          <td className="p-3 text-gray-500">{u.email}</td>
                          <td className="p-3"><span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full font-semibold">{u.subscription}</span></td>
                          <td className="p-3 text-xs text-gray-500">{u.subscriptionExpiresAt ? new Date(u.subscriptionExpiresAt).toLocaleDateString('id-ID') : 'Selamanya'}</td>
                        </tr>
                      ))}
                      {(!statsData?.premiumUsersList || statsData.premiumUsersList.length === 0) && (
                        <tr><td colSpan={4} className="text-center py-6 text-gray-400">Belum ada pengguna premium aktif.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'users' && canAccessTab('users', permissions) && (

          <>
            <Card className="bg-white border-none shadow-sm mb-6">
              <CardHeader>
                <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                  <PieChartIcon className="w-5 h-5" /> Distribusi Pengguna
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-indigo-900">Daftar Pengguna</CardTitle>
                <CardDescription>Kelola langganan dan batasi akses premium</CardDescription>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b text-gray-600 text-sm">
                      <th className="p-4">Nama</th>
                      <th className="p-4">Email</th>
                      <th className="p-4 text-center">Langganan</th>
                      <th className="p-4 text-center">Kuota</th>
                      <th className="p-4 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b text-sm hover:bg-slate-50">
                        <td className="p-4 font-medium text-gray-900">{user.name}</td>
                        <td className="p-4 text-gray-500">{user.email}</td>
                        <td className="p-4 text-center">
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700">
                            {user.subscription}
                          </span>
                        </td>
                        <td className="p-4 text-center text-gray-600">
                          {user.analysisRemaining === null || user.analysisRemaining === undefined
                            ? user.subscription !== 'Tidak Ada'
                              ? '∞'
                              : '-'
                            : user.analysisRemaining}
                        </td>
                        <td className="p-4 flex gap-2 justify-center flex-wrap">
                          {permissions.manageUsers && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleEditUser(user.id, user.name)} title="Edit">
                                <Edit className="w-4 h-4 text-blue-600" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleDeleteUser(user.id)} title="Hapus">
                                <Trash2 className="w-4 h-4 text-red-600" />
                              </Button>
                            </>
                          )}
                          {permissions.manageSubscriptions && (
                            <>
                              <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => handleManualSubscribe(user.id)} title="Beri paket">
                                <Crown className="w-4 h-4 text-indigo-600" />
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => handleGrantUnlimitedAnalysis(user.id)} title="Analisis unlimited">
                                ∞
                              </Button>
                              <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => handleLimitSubscription(user.id)} title="Batalkan langganan">
                                Batasi
                              </Button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === 'packages' && permissions.managePackages && (
          <Card className="bg-white border-none shadow-sm">
            <CardHeader className="flex flex-row flex-wrap justify-between items-center gap-3">
              <div>
                <CardTitle className="text-xl text-indigo-900">Kelola Paket Langganan</CardTitle>
                <CardDescription>Harga, kuota analisis, durasi (hari) — tersimpan di Firebase & Midtrans</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSeedPackages} className="text-indigo-700">
                  Paket Default
                </Button>
                <Button onClick={handleAddPackage} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Tambah Paket
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {packages.length === 0 && (
                <p className="text-gray-500 text-center py-6">Belum ada paket. Klik Tambah Paket atau Paket Default.</p>
              )}
              {packages.map((pkg) => (
                <div key={String(pkg.id)} className="border border-gray-200 p-5 rounded-xl space-y-4 relative bg-gray-50/50">
                  <div className="absolute top-2 right-2 flex gap-1">
                    <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDeletePackage(String(pkg.id))} title="Hapus">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mr-12">
                    <div>
                      <label className="text-xs font-medium text-gray-700">Nama Paket</label>
                      <Input value={String(pkg.name || '')} onChange={(e) => updatePackageState(String(pkg.id), 'name', e.target.value)} className="mt-1 bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Harga (Rp)</label>
                      <Input type="number" value={String(pkg.price ?? '')} onChange={(e) => updatePackageState(String(pkg.id), 'price', e.target.value)} className="mt-1 bg-white text-gray-900" />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Kuota Analisis (kosong = unlimited)</label>
                      <Input
                        type="number"
                        value={pkg.unlimited ? '' : String(pkg.analysisQuota ?? '')}
                        onChange={(e) => updatePackageState(String(pkg.id), 'analysisQuota', e.target.value)}
                        disabled={Boolean(pkg.unlimited)}
                        className="mt-1 bg-white text-gray-900"
                        placeholder="10, 25, 75..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-700">Durasi (hari)</label>
                      <Input type="number" value={String(pkg.durationDays ?? 30)} onChange={(e) => updatePackageState(String(pkg.id), 'durationDays', e.target.value)} className="mt-1 bg-white text-gray-900" />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={Boolean(pkg.unlimited)}
                      onChange={(e) => updatePackageState(String(pkg.id), 'unlimited', e.target.checked)}
                    />
                    Unlimited analisis
                  </label>
                  <div>
                    <label className="text-xs font-medium text-gray-700">Keterangan / Fitur (satu baris per poin)</label>
                    <textarea
                      value={featuresToEditorText(
                        Array.isArray(pkg.features) ? (pkg.features as string[]) : String(pkg.features || ''),
                      )}
                      onChange={(e) => updatePackageState(String(pkg.id), 'features', e.target.value)}
                      className="mt-1 w-full min-h-[140px] p-3 border border-gray-300 rounded-md bg-white text-gray-900 text-sm font-mono"
                      placeholder={`Fitur Lengkap Theta Indigo:\n* 10 kali Membuat analisa\n* Download PDF & Share WhatsApp`}
                    />
                  </div>
                  <Button onClick={() => handleSavePackage(pkg)} variant="outline" className="w-full border-indigo-200 text-indigo-700 hover:bg-indigo-50">
                    <Save className="w-4 h-4 mr-2" /> Simpan ke Firebase
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {activeTab === 'blog' && permissions.manageBlog && (
          <div className="space-y-6">
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-indigo-900">
                  {editingBlogId ? 'Edit Artikel' : 'Tulis Artikel Baru'}
                </CardTitle>
                <CardDescription>Editor TinyMCE — dukungan HTML, gambar, tabel, dan format lengkap</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-700">Judul artikel</label>
                  <Input value={newBlogTitle} onChange={(e) => setNewBlogTitle(e.target.value)} placeholder="Judul" className="mt-1 bg-white text-gray-900" />
                </div>
                <div className="rounded-xl border-2 border-indigo-200 bg-indigo-50/50 p-4 space-y-3">
                  <label className="text-sm font-semibold text-indigo-900 block">
                    Kategori artikel (muncul di landing & sub menu Blog)
                  </label>
                  <select
                    value={newBlogCategory}
                    onChange={(e) => setNewBlogCategory(e.target.value)}
                    className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 text-sm"
                  >
                    {blogCategoryOptions.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={newBlogCategory}
                    onChange={(e) => setNewBlogCategory(e.target.value)}
                    placeholder="Atau ketik kategori baru..."
                    className="bg-white text-gray-900"
                    list="blog-category-suggestions"
                  />
                  <datalist id="blog-category-suggestions">
                    {blogCategoryOptions.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                  <p className="text-xs text-gray-600">
                    Pilih atau ketik kategori. Artikel lama tanpa kategori = &quot;Umum&quot; — edit & simpan untuk
                    memperbarui.
                  </p>
                </div>
                <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">Tanggal & jam publikasi: </span>
                  {editingBlogId && blogPublishedAt
                    ? blogPublishedAt
                    : 'Otomatis terisi saat Anda klik Publikasikan'}
                </div>
                <TinyMceEditor value={newBlogContent} onChange={setNewBlogContent} height={480} />
                <div className="flex gap-2">
                  <Button onClick={handlePublishBlog} className="flex-1 bg-indigo-600 text-white">
                    <Send className="w-4 h-4 mr-2" />
                    {editingBlogId ? 'Simpan Perubahan' : 'Publikasikan'}
                  </Button>
                  {editingBlogId && (
                    <Button type="button" variant="outline" onClick={resetBlogForm} className="text-gray-700">
                      Batal
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-xl text-indigo-900">Daftar Artikel</CardTitle>
              </CardHeader>
              <CardContent>
                {blogs.map((blog) => (
                  <div key={blog.id} className="flex justify-between items-center py-3 border-b gap-2">
                    <div className="min-w-0">
                      <span className="text-gray-900 font-medium truncate block">{blog.title}</span>
                      <span className="text-xs text-gray-500">
                        {blog.category || DEFAULT_BLOG_CATEGORY}
                        {blog.createdAt ? ` · ${formatBlogDateTime(blog.createdAt)}` : ''}
                      </span>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => handleEditBlog(blog)} title="Edit">
                        <Edit className="w-4 h-4 text-blue-600" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDeleteBlog(blog.id)} title="Hapus">
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'admins' && permissions.manageAdmins && (
          <Card className="bg-white border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl text-indigo-900 flex items-center gap-2">
                <UserCog className="w-5 h-5 text-indigo-600" /> Kelola Admin & Hak Akses
              </CardTitle>
              <CardDescription>
                Tambah email admin baru sebagai **Full Admin** (akses penuh) atau **Admin Terbatas**, serta atur hak akses per fitur.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="email"
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="email.admin.baru@gmail.com"
                  className="bg-white text-gray-900 border-gray-300 focus:border-indigo-500"
                />
                <div className="flex gap-2 shrink-0">
                  <Button onClick={() => handleAddAdmin(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold">
                    <Plus className="w-4 h-4 mr-1" /> Tambah Full Admin
                  </Button>
                  <Button onClick={() => handleAddAdmin(false)} variant="outline" className="border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-semibold">
                    Tambah Terbatas
                  </Button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                {adminUsers.map((admin) => {
                  const isFull = Object.values(admin.permissions).every(Boolean);
                  return (
                    <div key={admin.id} className="border border-slate-200 rounded-xl p-5 space-y-4 bg-slate-50/50">
                      <div className="flex justify-between items-center flex-wrap gap-2 border-b border-slate-200 pb-3">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 text-base">{admin.email}</span>
                          {isFull ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200">
                              Full Admin
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-200 text-slate-700">
                              Admin Terbatas
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {!isFull && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleMakeFullAdmin(admin.id)}
                              className="text-xs text-indigo-600 hover:bg-indigo-50 font-semibold"
                            >
                              Jadikan Full Admin
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteAdmin(admin.id)}>
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-sm text-gray-800">
                        {(Object.keys(admin.permissions) as (keyof AdminPermissions)[]).map((key) => (
                          <label key={key} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-200 cursor-pointer hover:bg-indigo-50/30 transition-colors">
                            <input
                              type="checkbox"
                              checked={admin.permissions[key]}
                              onChange={() => toggleAdminPermission(admin.id, key)}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                            />
                            <span className="text-xs font-medium text-slate-800">
                              {PERMISSION_LABELS[key] || key}
                            </span>
                          </label>
                        ))}
                      </div>

                      <Button variant="outline" className="w-full bg-white hover:bg-slate-100 text-slate-800 border-slate-300 font-semibold text-xs" onClick={() => saveAdminPermissions(admin)}>
                        <Save className="w-4 h-4 mr-2 text-indigo-600" /> Simpan Hak Akses
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === 'media-ai' && permissions.manageBlog && (
          <div className="space-y-6">
            {/* Sub Tabs */}
            <div className="flex border-b border-slate-800 gap-4 pb-2">
              <button
                type="button"
                onClick={() => setMediaSubTab('generator')}
                className={`flex items-center gap-2 pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${
                  mediaSubTab === 'generator'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-4 h-4" /> Content Generator
              </button>
              <button
                type="button"
                onClick={() => setMediaSubTab('r2')}
                className={`flex items-center gap-2 pb-2 px-1 text-sm font-semibold transition-colors border-b-2 ${
                  mediaSubTab === 'r2'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-4 h-4" /> Cloudflare R2 Media Library
              </button>
            </div>

            {/* Sub Tab: Content Generator */}
            {mediaSubTab === 'generator' && (
              <div className="space-y-6">
                {/* Auto blog settings */}
                <Card className="bg-slate-900 border-indigo-500/20 text-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-indigo-300">
                      <Sparkles className="w-5 h-5 text-indigo-400" />
                      Pengaturan & Kontrol Otomatisasi AI
                    </CardTitle>
                    <CardDescription className="text-slate-450">
                      Aktifkan atau nonaktifkan cron job harian, atau picu pembuatan artikel saat ini secara manual.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-slate-950 border border-indigo-500/10">
                      <div className="space-y-1">
                        <span className="font-semibold text-lg flex items-center gap-2">
                          Status Generator Otomatis:
                          <span
                            className={`px-3 py-0.5 rounded-full text-xs font-bold ${
                              autoBlogEnabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
                            }`}
                          >
                            {autoBlogEnabled ? 'AKTIF' : 'NONAKTIF'}
                          </span>
                        </span>
                        <p className="text-sm text-slate-400">
                          Jika aktif, artikel akan otomatis diproduksi setiap hari pada pukul 05:00 WIB via endpoint cron.
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleToggleAutoBlog(!autoBlogEnabled)}
                          disabled={isSavingAutoBlog}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            autoBlogEnabled ? 'bg-indigo-600' : 'bg-slate-700'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              autoBlogEnabled ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                        <span className="text-sm font-semibold">{autoBlogEnabled ? 'Matikan' : 'Aktifkan'}</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-indigo-300">Picu Generator AI & Newsletter Sekarang</h4>
                        <p className="text-xs text-slate-405 mt-1">
                          Secara manual membuat artikel baru berdasarkan kategori acak dan langsung membroadcast email ke seluruh pengguna.
                        </p>
                      </div>
                      <Button
                        onClick={handleTriggerCron}
                        disabled={isGeneratingCron}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center gap-2 self-start md:self-center shrink-0"
                      >
                        {isGeneratingCron ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Memproses AI...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4" />
                            Generate AI Article & Blast Newsletter Now
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Manual Article Form */}
                <Card className="bg-slate-900 border-indigo-500/20 text-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl text-indigo-300">Buat Artikel Manual</CardTitle>
                    <CardDescription className="text-slate-400">
                      Tulis artikel manual yang akan dipublikasikan dengan banner gambar dinamis premium.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Judul Artikel</label>
                        <Input
                          value={manualTitle}
                          onChange={(e) => setManualTitle(e.target.value)}
                          placeholder="Masukkan judul artikel..."
                          className="bg-slate-950 border-slate-800 text-white"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Kategori Artikel</label>
                        <select
                          value={manualCategory}
                          onChange={(e) => setManualCategory(e.target.value)}
                          className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-white text-sm"
                        >
                          {blogCategoryOptions.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Emoji / Icon Banner</label>
                        <Input
                          value={manualIcon}
                          onChange={(e) => setManualIcon(e.target.value)}
                          placeholder="misal: 📖, 🙏, ✨"
                          className="bg-slate-950 border-slate-800 text-white"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="text-xs font-semibold text-slate-300 block mb-1">Warna Background Banner</label>
                        <select
                          value={manualBgColor}
                          onChange={(e) => setManualBgColor(e.target.value)}
                          className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-white text-sm"
                        >
                          <option value="1">1. Earthy Cream (Minimalis)</option>
                          <option value="2">2. Pure White (Putih Elegan)</option>
                          <option value="3">3. Biru Facebook (Energi Komunitas)</option>
                          <option value="4">4. Hijau Lumut (Keseimbangan & Alam)</option>
                          <option value="5">5. Hijau Spotify (Energi Dinamis)</option>
                          <option value="6">6. Ungu Metalik (Misteri Spiritual)</option>
                          <option value="7">7. Pink Metalik (Aura Kasih Sayang)</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">Excerpt (Ringkasan Singkat)</label>
                      <textarea
                        value={manualExcerpt}
                        onChange={(e) => setManualExcerpt(e.target.value)}
                        placeholder="Tulis ringkasan singkat untuk OG image & list card..."
                        className="w-full min-h-[60px] p-3 border border-slate-800 rounded-md bg-slate-950 text-white text-sm"
                      />
                    </div>

                    {/* Live Preview Section */}
                    <div className="p-4 rounded-xl border border-indigo-500/10 bg-slate-950 space-y-2">
                      <span className="text-xs font-semibold text-indigo-400 flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5" /> LIVE PREVIEW DYNAMIC BANNER
                      </span>
                      <div className="aspect-[1200/630] w-full overflow-hidden rounded-lg border border-slate-800 bg-slate-900 relative flex items-center justify-center">
                        {/* Render using local API route */}
                        <img
                          src={`/api/admin/generate-image?title=${encodeURIComponent(
                            manualTitle || 'Judul Artikel Anda'
                          )}&description=${encodeURIComponent(
                            manualExcerpt || 'Ringkasan singkat artikel spiritual Anda akan tampil di sini...'
                          )}&icon=${encodeURIComponent(manualIcon || '📖')}&bg=${manualBgColor}`}
                          alt="Dynamic Banner Preview"
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 text-right">
                        Resolusi banner: 1200x630 piksel (Optimal untuk Open Graph / Sosmed Share)
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-2">Konten Artikel (TinyMCE)</label>
                      <TinyMceEditor value={manualContent} onChange={setManualContent} height={380} />
                    </div>

                    <Button
                      onClick={handlePublishManual}
                      disabled={isPublishingManual}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold flex items-center justify-center gap-2 py-3"
                    >
                      {isPublishingManual ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Memublikasikan...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> Simpan & Publikasikan Artikel
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Sub Tab: Cloudflare R2 Media Library */}
            {mediaSubTab === 'r2' && (
              <div className="space-y-6">
                <Card className="bg-slate-900 border-indigo-500/20 text-white shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2 text-indigo-300">
                      <ImageIcon className="w-5 h-5 text-indigo-400" />
                      Unggah File ke Cloudflare R2
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Aset multimedia (gambar, video, audio) akan disimpan di bucket Cloudflare R2 kompatibel S3 Anda.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="border-2 border-dashed border-slate-800 hover:border-indigo-500/50 rounded-xl p-8 text-center transition-all bg-slate-950 relative">
                      <input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={isUploading}
                        id="r2-file-upload-input"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <div className="flex flex-col items-center justify-center gap-2">
                        {isUploading ? (
                          <>
                            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
                            <span className="font-semibold text-indigo-400">Mengunggah file ke R2...</span>
                          </>
                        ) : (
                          <>
                            <Plus className="w-10 h-10 text-slate-500 mb-1" />
                            <span className="font-semibold text-indigo-300">Pilih File (Choose File)</span>
                            <span className="text-xs text-slate-400">Mendukung format gambar (.jpg, .png, .webp) atau video (.mp4, .mov)</span>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Listing */}
                <Card className="bg-slate-900 border-indigo-500/20 text-white shadow-sm">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-xl text-indigo-300 flex items-center gap-2">
                        Media Library ({r2Files.length} file)
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        Kelola seluruh berkas aset yang terunggah di Cloudflare R2.
                      </CardDescription>
                    </div>
                    <Button
                      onClick={fetchR2Files}
                      disabled={r2Loading}
                      variant="outline"
                      className="border-slate-850 bg-slate-800 hover:bg-slate-700 text-white self-start sm:self-center"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${r2Loading ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Bulk Actions Bar */}
                    {selectedR2Keys.length > 0 && (
                      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl bg-indigo-950/20 border border-indigo-500/20">
                        <span className="text-sm font-semibold text-indigo-300">
                          Terpilih: {selectedR2Keys.length} file
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={handleBulkDownload}
                            className="bg-indigo-650 hover:bg-indigo-750 bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 h-9"
                          >
                            <Download className="w-3.5 h-3.5" /> Unduh Sekaligus
                          </Button>
                          <Button
                            onClick={() => handleDeleteFiles(selectedR2Keys)}
                            className="bg-rose-650 hover:bg-rose-750 bg-rose-600 text-white text-xs font-semibold flex items-center gap-1.5 h-9"
                          >
                            <Trash className="w-3.5 h-3.5" /> Hapus Sekaligus
                          </Button>
                        </div>
                      </div>
                    )}

                    {r2Loading ? (
                      <div className="text-center py-12">
                        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin mx-auto mb-2" />
                        <p className="text-slate-400">Memuat daftar media Cloudflare R2...</p>
                      </div>
                    ) : r2Files.length === 0 ? (
                      <p className="text-center py-12 text-slate-500">Belum ada file media yang diunggah.</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-slate-800 text-slate-400 text-xs font-semibold bg-slate-950/40">
                              <th className="p-3 w-10">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (selectedR2Keys.length === r2Files.length) {
                                      setSelectedR2Keys([]);
                                    } else {
                                      setSelectedR2Keys(r2Files.map((f) => f.key));
                                    }
                                  }}
                                  className="text-slate-400 hover:text-white"
                                >
                                  {selectedR2Keys.length === r2Files.length ? (
                                    <CheckSquare className="w-4 h-4 text-indigo-500" />
                                  ) : (
                                    <Square className="w-4 h-4" />
                                  )}
                                </button>
                              </th>
                              <th className="p-3">File</th>
                              <th className="p-3">Tipe</th>
                              <th className="p-3 text-right">Ukuran</th>
                              <th className="p-3 text-center">Aksi</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r2Files.map((file) => {
                              const isSelected = selectedR2Keys.includes(file.key);
                              const isImage = file.type.startsWith('image/');
                              const isVideo = file.type.startsWith('video/');
                              const isAudio = file.type.startsWith('audio/');

                              return (
                                <tr
                                  key={file.key}
                                  className={`border-b border-slate-800/60 hover:bg-slate-950/20 text-sm ${
                                    isSelected ? 'bg-indigo-950/5' : ''
                                  }`}
                                >
                                  <td className="p-3">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        if (isSelected) {
                                          setSelectedR2Keys(selectedR2Keys.filter((k) => k !== file.key));
                                        } else {
                                          setSelectedR2Keys([...selectedR2Keys, file.key]);
                                        }
                                      }}
                                      className="text-slate-400 hover:text-white"
                                    >
                                      {isSelected ? (
                                        <CheckSquare className="w-4 h-4 text-indigo-500" />
                                      ) : (
                                        <Square className="w-4 h-4" />
                                      )}
                                    </button>
                                  </td>
                                  <td className="p-3 font-medium max-w-xs truncate">
                                    <div className="flex items-center gap-3">
                                      {isImage ? (
                                        <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center shrink-0">
                                          <img
                                            src={file.url}
                                            alt={file.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.currentTarget.style.display = 'none';
                                            }}
                                          />
                                        </div>
                                      ) : (
                                        <div className="w-10 h-10 rounded bg-slate-950 border border-slate-800 flex items-center justify-center shrink-0 text-slate-500">
                                          {isVideo ? (
                                            <Video className="w-5 h-5" />
                                          ) : isAudio ? (
                                            <Music className="w-5 h-5" />
                                          ) : (
                                            <FileText className="w-5 h-5" />
                                          )}
                                        </div>
                                      )}
                                      <span className="truncate block" title={file.key}>
                                        {file.name}
                                      </span>
                                    </div>
                                  </td>
                                  <td className="p-3 text-xs text-slate-400 font-mono">{file.type}</td>
                                  <td className="p-3 text-right text-xs text-slate-350">
                                    {(file.size / 1024).toFixed(1)} KB
                                  </td>
                                  <td className="p-3 flex items-center justify-center gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDownloadFile(file.key)}
                                      className="h-8 border-slate-800 hover:bg-slate-800 text-xs px-2 text-indigo-400"
                                      title="Download"
                                    >
                                      <Download className="w-3.5 h-3.5" /> Download
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleDeleteFiles([file.key])}
                                      className="h-8 border-rose-950 hover:bg-rose-950 hover:text-white text-xs px-2 text-rose-500"
                                      title="Hapus"
                                    >
                                      <Trash className="w-3.5 h-3.5" /> Hapus
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
