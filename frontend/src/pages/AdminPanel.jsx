/**
 * AdminPanel Page
 * Comprehensive admin dashboard with 3 tabs:
 * 1. Học viên — Manage users: enrollment, admin status
 * 2. Đề thi thực chiến — Manage exam access (free/locked/published)
 * 3. Nội dung khóa học — Manage lessons (free/locked/published)
 * Only accessible by admins.
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineUsers,
  HiOutlineShieldCheck,
  HiOutlineBadgeCheck,
  HiOutlineSearch,
  HiOutlineRefresh,
  HiOutlineChevronLeft,
  HiOutlineMail,
  HiOutlineCheck,
  HiOutlineX,
  HiOutlineClock,
  HiOutlineLightningBolt,
  HiOutlineBookOpen,
  HiOutlineDocumentText,
  HiOutlineEyeOff,
  HiOutlineStar,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import {
  listUsers, enrollUser, unenrollUser, toggleAdmin,
  getExamSettings, updateExamSetting,
  getLessons, updateLesson,
} from '../api/client';

// ── Tab definition ───────────────────────────
const TABS = [
  { key: 'users', label: 'Học viên', icon: HiOutlineUsers },
  { key: 'exams', label: 'Đề thi', icon: HiOutlineLightningBolt },
  { key: 'content', label: 'Nội dung', icon: HiOutlineBookOpen },
];

const CATEGORY_LABELS = {
  nentang: 'Nền tảng',
  luyende: 'Luyện đề',
  thucchien: 'Thực chiến',
};

export default function AdminPanel() {
  const { user: currentUser, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  // ── Shared state ─────────────────────────
  const [activeTab, setActiveTab] = useState('users');
  const [toast, setToast] = useState(null);

  // ── Users state ──────────────────────────
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [usersError, setUsersError] = useState(null);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionLoading, setActionLoading] = useState(null);

  // ── Exams state ──────────────────────────
  const [exams, setExams] = useState([]);
  const [examSettings, setExamSettings] = useState({});
  const [examsLoading, setExamsLoading] = useState(false);
  const [examActionLoading, setExamActionLoading] = useState(null);

  // ── Lessons state ────────────────────────
  const [lessons, setLessons] = useState([]);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonCategory, setLessonCategory] = useState('all');
  const [lessonSearch, setLessonSearch] = useState('');
  const [lessonActionLoading, setLessonActionLoading] = useState(null);

  // ── Redirect non-admins ──────────────────
  useEffect(() => {
    if (!isAdmin && !authLoading) {
      navigate('/');
    }
  }, [isAdmin, authLoading, navigate]);

  // ── Toast helper ─────────────────────────
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ════════════════════════════════════════════
  // USERS: Fetch & Actions
  // ════════════════════════════════════════════
  const fetchUsers = useCallback(async () => {
    try {
      setUsersLoading(true);
      setUsersError(null);
      const res = await listUsers();
      setUsers(res.data);
    } catch (err) {
      setUsersError(err?.response?.data?.detail || 'Không thể tải danh sách');
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin, fetchUsers]);

  const handleEnroll = async (userId, userName) => {
    try {
      setActionLoading(userId);
      await enrollUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_enrolled: true } : u)));
      showToast(`✅ Đã cấp quyền cho ${userName}`);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleUnenroll = async (userId, userName) => {
    try {
      setActionLoading(userId);
      await unenrollUser(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_enrolled: false } : u)));
      showToast(`🔒 Đã thu hồi quyền của ${userName}`);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAdmin = async (userId, userName, currentlyAdmin) => {
    if (userId === currentUser?.id) {
      showToast('Không thể thay đổi quyền admin của chính mình', 'error');
      return;
    }
    try {
      setActionLoading(userId);
      await toggleAdmin(userId);
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, is_admin: !u.is_admin } : u)));
      showToast(currentlyAdmin ? `🔓 Đã gỡ quyền admin của ${userName}` : `🛡️ Đã cấp admin cho ${userName}`);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ════════════════════════════════════════════
  // EXAMS: Fetch & Actions
  // ════════════════════════════════════════════
  const fetchExams = useCallback(async () => {
    try {
      setExamsLoading(true);
      const [indexRes, settingsRes] = await Promise.all([
        fetch('/exams/index.json').then((r) => r.json()),
        getExamSettings().then((r) => r.data).catch(() => []),
      ]);

      const settingsMap = {};
      settingsRes.forEach((s) => { settingsMap[s.exam_id] = s; });
      setExamSettings(settingsMap);
      setExams(indexRes);
    } catch {
      setExams([]);
    } finally {
      setExamsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'exams') fetchExams();
  }, [isAdmin, activeTab, fetchExams]);

  const handleExamToggle = async (examId, field, currentValue) => {
    try {
      setExamActionLoading(examId);
      const res = await updateExamSetting(examId, { [field]: !currentValue });
      setExamSettings((prev) => ({ ...prev, [examId]: res.data }));
      showToast(`✅ Đã cập nhật đề thi`);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi cập nhật', 'error');
    } finally {
      setExamActionLoading(null);
    }
  };

  // ════════════════════════════════════════════
  // LESSONS: Fetch & Actions
  // ════════════════════════════════════════════
  const fetchLessons = useCallback(async () => {
    try {
      setLessonsLoading(true);
      const res = await getLessons({ published_only: false });
      setLessons(res.data);
    } catch {
      setLessons([]);
    } finally {
      setLessonsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin && activeTab === 'content') fetchLessons();
  }, [isAdmin, activeTab, fetchLessons]);

  const handleLessonToggle = async (lessonId, field, currentValue) => {
    try {
      setLessonActionLoading(lessonId);
      const res = await updateLesson(lessonId, { [field]: !currentValue });
      setLessons((prev) => prev.map((l) => (l.id === lessonId ? res.data : l)));
      showToast(`✅ Đã cập nhật bài giảng`);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi cập nhật', 'error');
    } finally {
      setLessonActionLoading(null);
    }
  };

  // ── Computed: Users ──────────────────────
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      userSearch === '' ||
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesFilter =
      userFilter === 'all' ||
      (userFilter === 'enrolled' && u.is_enrolled) ||
      (userFilter === 'unenrolled' && !u.is_enrolled) ||
      (userFilter === 'admin' && u.is_admin);
    return matchesSearch && matchesFilter;
  });
  const totalUsers = users.length;
  const enrolledCount = users.filter((u) => u.is_enrolled).length;
  const adminCount = users.filter((u) => u.is_admin).length;

  // ── Computed: Lessons ────────────────────
  const filteredLessons = lessons.filter((l) => {
    const matchesCat = lessonCategory === 'all' || l.category === lessonCategory;
    const matchesSearch =
      lessonSearch === '' ||
      l.title.toLowerCase().includes(lessonSearch.toLowerCase()) ||
      (l.subject || '').toLowerCase().includes(lessonSearch.toLowerCase());
    return matchesCat && matchesSearch;
  });

  if (!isAdmin) return null;

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] max-w-sm animate-in">
          <div className={`px-4 py-3 rounded-xl shadow-lg text-sm font-medium border ${
            toast.type === 'error'
              ? 'bg-red-50 dark:bg-red-900/80 border-red-200 dark:border-red-800 text-red-700 dark:text-red-200'
              : 'bg-green-50 dark:bg-green-900/80 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200'
          }`}>
            {toast.message}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-gradient-to-r from-slate-700 to-slate-900 dark:from-slate-800 dark:to-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <button onClick={() => navigate('/')} className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white mb-4 transition-colors">
            <HiOutlineChevronLeft className="h-4 w-4" /> Về trang chủ
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">🛡️ Bảng điều khiển Admin</h1>
          <p className="text-white/60">Quản lý học viên, đề thi và nội dung khóa học</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-1 bg-white dark:bg-slate-800 rounded-xl p-1.5 mb-8 border border-gray-100 dark:border-slate-700 shadow-sm">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-primary-600 text-white shadow-md'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* ══════════════════════════════════════ */}
        {/* TAB 1: USERS                          */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'users' && (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                    <HiOutlineUsers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalUsers}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tổng người dùng</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
                    <HiOutlineBadgeCheck className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{enrolledCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Đã đăng ký</p>
                  </div>
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                    <HiOutlineShieldCheck className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{adminCount}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Quản trị viên</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Search & Filter */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Tìm theo tên hoặc email..." value={userSearch} onChange={(e) => setUserSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  {[{ key: 'all', label: 'Tất cả' }, { key: 'enrolled', label: 'Đã ĐK' }, { key: 'unenrolled', label: 'Chưa ĐK' }, { key: 'admin', label: 'Admin' }].map((f) => (
                    <button key={f.key} onClick={() => setUserFilter(f.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${userFilter === f.key ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <button onClick={fetchUsers} disabled={usersLoading}
                  className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" title="Tải lại">
                  <HiOutlineRefresh className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {usersError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6 text-sm">{usersError}</div>
            )}

            {/* Users Table */}
            {usersLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <HiOutlineUsers className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">{userSearch ? 'Không tìm thấy' : 'Chưa có người dùng'}</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Người dùng</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trạng thái</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Đăng nhập gần nhất</th>
                        <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                      {filteredUsers.map((u) => (
                        <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              {u.picture ? (
                                <img src={u.picture} alt="" className="w-9 h-9 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                                  <span className="text-xs font-bold text-gray-500 dark:text-gray-400">{u.name?.charAt(0)?.toUpperCase()}</span>
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {u.name}{u.id === currentUser?.id && <span className="ml-1.5 text-[10px] text-gray-400 dark:text-gray-500">(bạn)</span>}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                  <HiOutlineMail className="h-3 w-3 flex-shrink-0" />{u.email}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-wrap gap-1.5">
                              {u.is_admin && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400"><HiOutlineShieldCheck className="h-3 w-3" /> Admin</span>}
                              {u.is_enrolled ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"><HiOutlineCheck className="h-3 w-3" /> Đã đăng ký</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400"><HiOutlineX className="h-3 w-3" /> Chưa đăng ký</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <HiOutlineClock className="h-3.5 w-3.5" />
                              {new Date(u.last_login).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {u.is_enrolled ? (
                                <button onClick={() => handleUnenroll(u.id, u.name)} disabled={actionLoading === u.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50">
                                  {actionLoading === u.id ? '...' : 'Thu hồi'}
                                </button>
                              ) : (
                                <button onClick={() => handleEnroll(u.id, u.name)} disabled={actionLoading === u.id}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50">
                                  {actionLoading === u.id ? '...' : 'Cấp quyền'}
                                </button>
                              )}
                              <button onClick={() => handleToggleAdmin(u.id, u.name, u.is_admin)}
                                disabled={actionLoading === u.id || u.id === currentUser?.id}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-50 ${u.is_admin ? 'border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20' : 'border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
                                title={u.id === currentUser?.id ? 'Không thể thay đổi quyền admin của chính mình' : ''}>
                                {u.is_admin ? 'Gỡ Admin' : 'Cấp Admin'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y divide-gray-50 dark:divide-slate-700/50">
                  {filteredUsers.map((u) => (
                    <div key={u.id} className="p-4">
                      <div className="flex items-start gap-3 mb-3">
                        {u.picture ? (
                          <img src={u.picture} alt="" className="w-10 h-10 rounded-full flex-shrink-0" referrerPolicy="no-referrer" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400">{u.name?.charAt(0)?.toUpperCase()}</span>
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name}{u.id === currentUser?.id && <span className="ml-1 text-[10px] text-gray-400">(bạn)</span>}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {u.is_admin && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">Admin</span>}
                            <span className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${u.is_enrolled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'}`}>{u.is_enrolled ? 'Đã ĐK' : 'Chưa ĐK'}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-13">
                        {u.is_enrolled ? (
                          <button onClick={() => handleUnenroll(u.id, u.name)} disabled={actionLoading === u.id} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-center disabled:opacity-50">Thu hồi</button>
                        ) : (
                          <button onClick={() => handleEnroll(u.id, u.name)} disabled={actionLoading === u.id} className="flex-1 px-3 py-2 rounded-lg text-xs font-medium bg-green-600 text-white text-center disabled:opacity-50">Cấp quyền</button>
                        )}
                        <button onClick={() => handleToggleAdmin(u.id, u.name, u.is_admin)} disabled={actionLoading === u.id || u.id === currentUser?.id}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-center disabled:opacity-50">
                          {u.is_admin ? 'Gỡ Admin' : 'Cấp Admin'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hiển thị {filteredUsers.length} / {totalUsers} người dùng</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══════════════════════════════════════ */}
        {/* TAB 2: EXAMS                          */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'exams' && (
          <>
            <div className="bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-900/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-orange-800 dark:text-orange-300">
                <strong>💡 Hướng dẫn:</strong> Bật <strong>"Miễn phí"</strong> để cho phép tất cả khách truy cập làm đề (không cần đăng ký).
                Tắt để chỉ cho phép học viên đã đăng ký.
                <strong> "Hiển thị"</strong> kiểm soát đề có xuất hiện trong danh sách hay không.
              </p>
            </div>

            {examsLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
            ) : exams.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <HiOutlineDocumentText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400">Chưa có đề thi nào trong index.json</p>
              </div>
            ) : (
              <div className="space-y-4">
                {exams.map((exam) => {
                  const setting = examSettings[exam.id];
                  const isFree = setting ? setting.is_free : exam.isFree;
                  const isPublished = setting ? setting.is_published : true;

                  return (
                    <div key={exam.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className="font-bold text-gray-900 dark:text-white">{exam.title}</h3>
                            {isFree && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                                <HiOutlineStar className="h-3 w-3" /> Miễn phí
                              </span>
                            )}
                            {!isPublished && (
                              <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400">
                                <HiOutlineEyeOff className="h-3 w-3" /> Ẩn
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{exam.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                            <span>{exam.totalQuestions} câu</span>
                            <span>{exam.timeMinutes} phút</span>
                            <span>{exam.maxScore} điểm</span>
                            <span className="font-mono">ID: {exam.id}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={() => handleExamToggle(exam.id, 'is_free', isFree)} disabled={examActionLoading === exam.id}
                              className={`relative w-12 h-7 rounded-full transition-colors ${isFree ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'} ${examActionLoading === exam.id ? 'opacity-50' : ''}`}>
                              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isFree ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Miễn phí</span>
                          </div>
                          <div className="flex flex-col items-center gap-1">
                            <button onClick={() => handleExamToggle(exam.id, 'is_published', isPublished)} disabled={examActionLoading === exam.id}
                              className={`relative w-12 h-7 rounded-full transition-colors ${isPublished ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'} ${examActionLoading === exam.id ? 'opacity-50' : ''}`}>
                              <span className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${isPublished ? 'translate-x-5' : 'translate-x-0'}`} />
                            </button>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">Hiển thị</span>
                          </div>
                        </div>
                      </div>

                      {exam.sections && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {Object.entries(exam.sections).map(([sub, info]) => (
                            <span key={sub} className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">{sub}: {info.count} câu</span>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <div className="flex justify-center mt-6">
              <button onClick={fetchExams} disabled={examsLoading}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                <HiOutlineRefresh className={`h-4 w-4 ${examsLoading ? 'animate-spin' : ''}`} /> Tải lại
              </button>
            </div>
          </>
        )}

        {/* ══════════════════════════════════════ */}
        {/* TAB 3: CONTENT (LESSONS)              */}
        {/* ══════════════════════════════════════ */}
        {activeTab === 'content' && (
          <>
            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-900/30 rounded-xl p-4 mb-6">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <strong>💡 Hướng dẫn:</strong> Quản lý quyền truy cập bài giảng và tài liệu.
                <strong> "Miễn phí"</strong> = ai cũng xem được (kể cả khách).
                <strong> "Xuất bản"</strong> = hiển thị trong danh sách bài giảng.
                Bài chưa xuất bản sẽ không hiện cho học viên.
              </p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="text" placeholder="Tìm bài giảng..." value={lessonSearch} onChange={(e) => setLessonSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                  {[{ key: 'all', label: 'Tất cả' }, { key: 'nentang', label: 'Nền tảng' }, { key: 'luyende', label: 'Luyện đề' }].map((f) => (
                    <button key={f.key} onClick={() => setLessonCategory(f.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${lessonCategory === f.key ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <button onClick={fetchLessons} disabled={lessonsLoading}
                  className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" title="Tải lại">
                  <HiOutlineRefresh className={`h-4 w-4 ${lessonsLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {lessonsLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <HiOutlineBookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">{lessonSearch ? 'Không tìm thấy bài giảng' : 'Chưa có bài giảng nào'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Tạo bài giảng qua API: POST /api/lessons/</p>
              </div>
            ) : (
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Bài giảng</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phân loại</th>
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tài nguyên</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Miễn phí</th>
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Xuất bản</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                      {filteredLessons.map((l) => (
                        <tr key={l.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-5 py-4">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{l.title}</p>
                              {l.description && <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{l.description}</p>}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex w-fit px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                l.category === 'nentang' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : l.category === 'luyende' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                              }`}>{CATEGORY_LABELS[l.category] || l.category}</span>
                              {l.subject && <span className="text-[10px] text-gray-400 dark:text-gray-500">{l.subject}</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="flex gap-2">
                              {l.video_drive_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">📹 Video</span>}
                              {l.pdf_drive_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400">📄 PDF</span>}
                              {!l.video_drive_id && !l.pdf_drive_id && <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => handleLessonToggle(l.id, 'is_free', l.is_free)} disabled={lessonActionLoading === l.id}
                              className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${l.is_free ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'} ${lessonActionLoading === l.id ? 'opacity-50' : ''}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${l.is_free ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <button onClick={() => handleLessonToggle(l.id, 'is_published', l.is_published)} disabled={lessonActionLoading === l.id}
                              className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${l.is_published ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'} ${lessonActionLoading === l.id ? 'opacity-50' : ''}`}>
                              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${l.is_published ? 'translate-x-4' : 'translate-x-0'}`} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="md:hidden divide-y divide-gray-50 dark:divide-slate-700/50">
                  {filteredLessons.map((l) => (
                    <div key={l.id} className="p-4">
                      <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{l.title}</p>
                      <div className="flex items-center gap-2 mb-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          l.category === 'nentang' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                        }`}>{CATEGORY_LABELS[l.category] || l.category}</span>
                        {l.subject && <span className="text-[10px] text-gray-400">{l.subject}</span>}
                      </div>
                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Miễn phí</span>
                          <button onClick={() => handleLessonToggle(l.id, 'is_free', l.is_free)} disabled={lessonActionLoading === l.id}
                            className={`relative w-10 h-6 rounded-full transition-colors ${l.is_free ? 'bg-green-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${l.is_free ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Xuất bản</span>
                          <button onClick={() => handleLessonToggle(l.id, 'is_published', l.is_published)} disabled={lessonActionLoading === l.id}
                            className={`relative w-10 h-6 rounded-full transition-colors ${l.is_published ? 'bg-blue-500' : 'bg-gray-300 dark:bg-slate-600'}`}>
                            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${l.is_published ? 'translate-x-4' : 'translate-x-0'}`} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Hiển thị {filteredLessons.length} / {lessons.length} bài giảng</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
