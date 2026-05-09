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
  HiOutlinePlus,
  HiOutlineUpload,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlineUserAdd,
  HiOutlineAcademicCap,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import {
  listUsers, createUser, updateUser, deleteUser,
  enrollUser, unenrollUser, toggleAdmin,
  getExamSettings, updateExamSetting,
  getLessons, updateLesson, createLesson, importLessons, deleteLesson,
  listUserExamAttempts,
} from '../api/client';

const COURSE_TYPE_OPTIONS = [
  { value: '', label: '— Chưa chọn —' },
  { value: 'tu_luyen', label: 'Tự luyện' },
  { value: 'co_ban', label: 'Cơ bản' },
  { value: 'nang_cao', label: 'Nâng cao' },
];

const COURSE_TYPE_LABEL = {
  tu_luyen: 'Tự luyện',
  co_ban: 'Cơ bản',
  nang_cao: 'Nâng cao',
};

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

  // Add-student form
  const [showAddUser, setShowAddUser] = useState(false);
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '', name: '', enrollment_year: new Date().getFullYear(),
    course_type: '', is_enrolled: true, is_admin: false,
  });

  // Edit-student modal
  const [editingUser, setEditingUser] = useState(null);
  const [editLoading, setEditLoading] = useState(false);

  // Attempts viewer modal
  const [attemptsUser, setAttemptsUser] = useState(null);
  const [attemptsList, setAttemptsList] = useState([]);
  const [attemptsLoading, setAttemptsLoading] = useState(false);

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

  // ── Add Lesson state ─────────────────────
  const [showAddLesson, setShowAddLesson] = useState(false); // 'form' | 'csv' | false
  const [addLessonLoading, setAddLessonLoading] = useState(false);
  const [newLesson, setNewLesson] = useState({
    title: '', description: '', order: 0, category: 'nentang', subject: '',
    video_drive_id: '', pdf_drive_id: '', answer_pdf_drive_id: '', is_published: false, is_free: false,
  });
  const [csvMode, setCsvMode] = useState('skip');

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

  // ── Pre-register a student by email ──
  const handleAddUser = async (e) => {
    e.preventDefault();
    const email = newUser.email.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      showToast('Vui lòng nhập email hợp lệ', 'error');
      return;
    }
    try {
      setAddUserLoading(true);
      const payload = {
        email,
        name: newUser.name.trim() || null,
        enrollment_year: newUser.enrollment_year || null,
        course_type: newUser.course_type || null,
        is_enrolled: !!newUser.is_enrolled,
        is_admin: !!newUser.is_admin,
      };
      const res = await createUser(payload);
      // Replace existing or prepend
      setUsers((prev) => {
        const idx = prev.findIndex((u) => u.id === res.data.id);
        if (idx >= 0) {
          const copy = [...prev]; copy[idx] = res.data; return copy;
        }
        return [res.data, ...prev];
      });
      showToast(`✅ Đã thêm/cập nhật ${res.data.email}`);
      setNewUser({
        email: '', name: '', enrollment_year: new Date().getFullYear(),
        course_type: '', is_enrolled: true, is_admin: false,
      });
      setShowAddUser(false);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi thêm học viên', 'error');
    } finally {
      setAddUserLoading(false);
    }
  };

  // ── Edit student (modal) ──
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      setEditLoading(true);
      const payload = {
        name: editingUser.name?.trim() || null,
        enrollment_year: editingUser.enrollment_year || null,
        course_type: editingUser.course_type || null,
        is_enrolled: !!editingUser.is_enrolled,
      };
      const res = await updateUser(editingUser.id, payload);
      setUsers((prev) => prev.map((u) => (u.id === res.data.id ? res.data : u)));
      showToast('✅ Đã cập nhật học viên');
      setEditingUser(null);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi cập nhật', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteUser = async (u) => {
    if (u.id === currentUser?.id) {
      showToast('Không thể xoá chính mình', 'error');
      return;
    }
    if (!window.confirm(`Xoá tài khoản ${u.email}? Hành động này không thể hoàn tác.`)) return;
    try {
      setActionLoading(u.id);
      await deleteUser(u.id);
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      showToast(`🗑️ Đã xoá ${u.email}`);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi xoá', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // ── View attempts (modal) ──
  const handleViewAttempts = async (u) => {
    setAttemptsUser(u);
    setAttemptsLoading(true);
    setAttemptsList([]);
    try {
      const res = await listUserExamAttempts(u.id);
      setAttemptsList(res.data);
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi tải lịch sử', 'error');
    } finally {
      setAttemptsLoading(false);
    }
  };

  // ════════════════════════════════════════════
  // EXAMS: Fetch & Actions
  // ════════════════════════════════════════════
  const fetchExams = useCallback(async () => {
    try {
      setExamsLoading(true);
      const [indexRes, settingsRes] = await Promise.all([
        fetch('/exams/index.json', { cache: 'no-store' }).then((r) => r.json()),
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

  const handleDeleteLesson = async (lesson) => {
    const ok = window.confirm(
      `Bạn có chắc muốn xóa bài giảng "${lesson.title}" (ID: ${lesson.id})? Hành động này không thể hoàn tác.`
    );
    if (!ok) return;
    try {
      setLessonActionLoading(lesson.id);
      await deleteLesson(lesson.id);
      setLessons((prev) => prev.filter((l) => l.id !== lesson.id));
      showToast('🗑️ Đã xóa bài giảng');
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi xóa bài giảng', 'error');
    } finally {
      setLessonActionLoading(null);
    }
  };

  const handleCreateLesson = async (e) => {
    e.preventDefault();
    if (!newLesson.title.trim()) {
      showToast('Tiêu đề bài giảng là bắt buộc', 'error');
      return;
    }
    try {
      setAddLessonLoading(true);
      const payload = {
        ...newLesson,
        subject: newLesson.subject || null,
        description: newLesson.description || null,
        video_drive_id: newLesson.video_drive_id || null,
        pdf_drive_id: newLesson.pdf_drive_id || null,
        answer_pdf_drive_id: newLesson.answer_pdf_drive_id || null,
      };
      await createLesson(payload);
      showToast('✅ Đã tạo bài giảng mới');
      setNewLesson({ title: '', description: '', order: 0, category: 'nentang', subject: '', video_drive_id: '', pdf_drive_id: '', answer_pdf_drive_id: '', is_published: false, is_free: false });
      setShowAddLesson(false);
      fetchLessons();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi tạo bài giảng', 'error');
    } finally {
      setAddLessonLoading(false);
    }
  };

  const handleImportCSV = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setAddLessonLoading(true);
      const res = await importLessons(file, csvMode);
      showToast(`✅ ${res.data.message}`);
      setShowAddLesson(false);
      fetchLessons();
    } catch (err) {
      showToast(err?.response?.data?.detail || 'Lỗi import file', 'error');
    } finally {
      setAddLessonLoading(false);
      e.target.value = '';
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
      (userFilter === 'pending' && !u.has_logged_in) ||
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
                  {[{ key: 'all', label: 'Tất cả' }, { key: 'enrolled', label: 'Đã ĐK' }, { key: 'unenrolled', label: 'Chưa ĐK' }, { key: 'pending', label: 'Chờ đăng nhập' }, { key: 'admin', label: 'Admin' }].map((f) => (
                    <button key={f.key} onClick={() => setUserFilter(f.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${userFilter === f.key ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <button onClick={() => setShowAddUser((s) => !s)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${showAddUser ? 'bg-primary-600 text-white' : 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/30'}`}>
                  <HiOutlineUserAdd className="h-4 w-4" /> Thêm học viên
                </button>
                <button onClick={fetchUsers} disabled={usersLoading}
                  className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" title="Tải lại">
                  <HiOutlineRefresh className={`h-4 w-4 ${usersLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Add Student Form */}
            {showAddUser && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                  <HiOutlineUserAdd className="h-4 w-4 text-primary-600" /> Thêm học viên bằng email
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  Tài khoản sẽ được tạo trước — các thông tin như tên và ảnh đại diện sẽ tự động được cập nhật khi học viên lần đầu đăng nhập bằng Google. Nếu email đã tồn tại, hệ thống sẽ cập nhật bản ghi hiện tại.
                </p>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Email *</label>
                      <input type="email" required value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="hocvien@gmail.com"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Họ tên (tùy chọn)</label>
                      <input type="text" value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="Để trống để lấy tại thời điểm đăng nhập Google"
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Năm nhập học</label>
                      <input type="number" min="2024" max="2030" value={newUser.enrollment_year}
                        onChange={(e) => setNewUser({ ...newUser, enrollment_year: parseInt(e.target.value) || null })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Loại khóa học</label>
                      <select value={newUser.course_type}
                        onChange={(e) => setNewUser({ ...newUser, course_type: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                        {COURSE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-6">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newUser.is_enrolled}
                        onChange={(e) => setNewUser({ ...newUser, is_enrolled: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Cấp quyền truy cập ngay (đã đăng ký)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={newUser.is_admin}
                        onChange={(e) => setNewUser({ ...newUser, is_admin: e.target.checked })}
                        className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">Là quản trị viên</span>
                    </label>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={addUserLoading}
                      className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
                      {addUserLoading ? 'Đang lưu...' : 'Tạo tài khoản'}
                    </button>
                    <button type="button" onClick={() => setShowAddUser(false)}
                      className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

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
                        <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Khóa học</th>
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
                              {!u.has_logged_in && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400" title="Học viên chưa đăng nhập Google lần nào"><HiOutlineClock className="h-3 w-3" /> Chờ đăng nhập</span>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <div className="text-xs text-gray-600 dark:text-gray-300">
                              {u.course_type ? (
                                <span className="inline-flex items-center gap-1"><HiOutlineAcademicCap className="h-3.5 w-3.5" />{COURSE_TYPE_LABEL[u.course_type] || u.course_type}</span>
                              ) : <span className="text-gray-300 dark:text-gray-600">—</span>}
                              {u.enrollment_year && <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Năm {u.enrollment_year}</div>}
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
                              <button onClick={() => handleViewAttempts(u)}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Lịch sử thi">
                                <HiOutlineDocumentText className="h-4 w-4" />
                              </button>
                              <button onClick={() => setEditingUser({ ...u, course_type: u.course_type || '' })}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Chỉnh sửa">
                                <HiOutlinePencil className="h-4 w-4" />
                              </button>
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
                              <button onClick={() => handleDeleteUser(u)}
                                disabled={actionLoading === u.id || u.id === currentUser?.id}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-30" title="Xoá">
                                <HiOutlineTrash className="h-4 w-4" />
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
                            {!u.has_logged_in && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400">Chờ đăng nhập</span>}
                            {u.course_type && <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">{COURSE_TYPE_LABEL[u.course_type] || u.course_type}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-13">
                        <button onClick={() => setEditingUser({ ...u, course_type: u.course_type || '' })}
                          className="flex-1 px-3 py-2 rounded-lg text-xs font-medium border border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 text-center">Sửa</button>
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

            {/* Add Lesson Buttons */}
            <div className="flex gap-3 mb-6">
              <button onClick={() => setShowAddLesson(showAddLesson === 'form' ? false : 'form')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showAddLesson === 'form' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                <HiOutlinePlus className="h-4 w-4" /> Thêm bài giảng
              </button>
              <button onClick={() => setShowAddLesson(showAddLesson === 'csv' ? false : 'csv')}
                className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${showAddLesson === 'csv' ? 'bg-primary-600 text-white' : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'}`}>
                <HiOutlineUpload className="h-4 w-4" /> Import CSV/XLSX
              </button>
            </div>

            {/* Add Lesson Form */}
            {showAddLesson === 'form' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">📝 Thêm bài giảng mới</h3>
                <form onSubmit={handleCreateLesson} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tiêu đề *</label>
                      <input type="text" value={newLesson.title} onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })} required
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Tên bài giảng" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả</label>
                      <input type="text" value={newLesson.description} onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Mô tả ngắn" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phân loại</label>
                      <select value={newLesson.category} onChange={(e) => setNewLesson({ ...newLesson, category: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                        <option value="nentang">Nền tảng</option>
                        <option value="luyende">Luyện đề</option>
                        <option value="thucchien">Thực chiến</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Môn học</label>
                      <input type="text" value={newLesson.subject} onChange={(e) => setNewLesson({ ...newLesson, subject: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="vd: toan, ly, hoa, tieng_viet" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Video Drive ID</label>
                      <input type="text" value={newLesson.video_drive_id} onChange={(e) => setNewLesson({ ...newLesson, video_drive_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Google Drive file ID hoặc URL" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">PDF Drive ID</label>
                      <input type="text" value={newLesson.pdf_drive_id} onChange={(e) => setNewLesson({ ...newLesson, pdf_drive_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Google Drive file ID hoặc URL" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">PDF đáp án (tuỳ chọn)</label>
                      <input type="text" value={newLesson.answer_pdf_drive_id} onChange={(e) => setNewLesson({ ...newLesson, answer_pdf_drive_id: e.target.value })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" placeholder="Google Drive file ID hoặc URL" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Thứ tự</label>
                      <input type="number" value={newLesson.order} onChange={(e) => setNewLesson({ ...newLesson, order: parseInt(e.target.value) || 0 })}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                    </div>
                    <div className="flex items-end gap-6">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newLesson.is_published} onChange={(e) => setNewLesson({ ...newLesson, is_published: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Xuất bản</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={newLesson.is_free} onChange={(e) => setNewLesson({ ...newLesson, is_free: e.target.checked })}
                          className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Miễn phí</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="submit" disabled={addLessonLoading}
                      className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
                      {addLessonLoading ? 'Đang tạo...' : 'Tạo bài giảng'}
                    </button>
                    <button type="button" onClick={() => setShowAddLesson(false)}
                      className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* CSV Import Panel */}
            {showAddLesson === 'csv' && (
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6 mb-6">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">📁 Import bài giảng từ CSV/XLSX</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                  File cần có các cột: <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">title</code> (bắt buộc),{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">description</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">order</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">category</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">subject</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">video_drive_id</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">pdf_drive_id</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">answer_pdf_drive_id</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">is_published</code>,{' '}
                  <code className="bg-gray-100 dark:bg-slate-700 px-1 rounded">is_free</code>
                </p>
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  <div>
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Chế độ import</label>
                    <select value={csvMode} onChange={(e) => setCsvMode(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                      <option value="skip">Bỏ qua trùng</option>
                      <option value="overwrite">Ghi đè trùng</option>
                      <option value="append">Luôn tạo mới</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Chọn file</label>
                    <input type="file" accept=".csv,.xlsx" onChange={handleImportCSV} disabled={addLessonLoading}
                      className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 dark:file:bg-primary-900/20 file:text-primary-700 dark:file:text-primary-400 hover:file:bg-primary-100 dark:hover:file:bg-primary-900/30 file:cursor-pointer disabled:opacity-50" />
                  </div>
                  {addLessonLoading && <div className="flex items-end pb-1"><div className="w-5 h-5 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin" /></div>}
                </div>
                <button type="button" onClick={() => setShowAddLesson(false)}
                  className="mt-4 px-4 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Đóng
                </button>
              </div>
            )}

            {lessonsLoading ? (
              <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
                <HiOutlineBookOpen className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 dark:text-gray-400 mb-2">{lessonSearch ? 'Không tìm thấy bài giảng' : 'Chưa có bài giảng nào'}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Nhấn "Thêm bài giảng" hoặc "Import CSV/XLSX" ở trên để bắt đầu</p>
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
                        <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Xóa</th>
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
                              {l.answer_pdf_drive_id && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">🗂️ Đáp án</span>}
                              {!l.video_drive_id && !l.pdf_drive_id && !l.answer_pdf_drive_id && <span className="text-[10px] text-gray-400 dark:text-gray-500">—</span>}
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
                          <td className="px-5 py-4 text-center">
                            <button
                              onClick={() => handleDeleteLesson(l)}
                              disabled={lessonActionLoading === l.id}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                              title="Xóa bài giảng"
                            >
                              <HiOutlineTrash className="h-4 w-4" />
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
                        <button
                          onClick={() => handleDeleteLesson(l)}
                          disabled={lessonActionLoading === l.id}
                          className="inline-flex items-center justify-center p-2 rounded-lg border border-red-200 dark:border-red-900/40 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                          title="Xóa bài giảng"
                        >
                          <HiOutlineTrash className="h-4 w-4" />
                        </button>
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

      {/* ══════════════════════════════════════ */}
      {/* MODAL: Edit student                   */}
      {/* ══════════════════════════════════════ */}
      {editingUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !editLoading && setEditingUser(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <HiOutlinePencil className="h-4 w-4 text-primary-600" /> Cập nhật học viên
              </h3>
              <button onClick={() => !editLoading && setEditingUser(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-slate-700/50 rounded-lg px-3 py-2 flex items-center gap-2">
                <HiOutlineMail className="h-3.5 w-3.5" />
                <span className="font-mono">{editingUser.email}</span>
                {!editingUser.has_logged_in && (
                  <span className="ml-auto inline-flex items-center gap-1 text-yellow-700 dark:text-yellow-400">
                    <HiOutlineClock className="h-3 w-3" /> Chờ đăng nhập
                  </span>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Họ tên</label>
                <input type="text" value={editingUser.name || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Năm nhập học</label>
                  <input type="number" min="2024" max="2030" value={editingUser.enrollment_year || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, enrollment_year: parseInt(e.target.value) || null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Loại khóa học</label>
                  <select value={editingUser.course_type || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, course_type: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none">
                    {COURSE_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!editingUser.is_enrolled}
                  onChange={(e) => setEditingUser({ ...editingUser, is_enrolled: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Đã đăng ký khóa học (có quyền truy cập đầy đủ)</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={editLoading}
                  className="flex-1 px-4 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
                  {editLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button type="button" onClick={() => setEditingUser(null)} disabled={editLoading}
                  className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════ */}
      {/* MODAL: View exam attempts             */}
      {/* ══════════════════════════════════════ */}
      {attemptsUser && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setAttemptsUser(null)} />
          <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">📊 Lịch sử thi thực chiến</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{attemptsUser.name} · {attemptsUser.email}</p>
              </div>
              <button onClick={() => setAttemptsUser(null)} className="p-1 text-gray-400 hover:text-gray-600">
                <HiOutlineX className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              {attemptsLoading ? (
                <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
              ) : attemptsList.length === 0 ? (
                <div className="text-center py-10">
                  <HiOutlineDocumentText className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-sm text-gray-500 dark:text-gray-400">Học viên chưa nộp bài thi nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {attemptsList.map((a) => {
                    const pct = a.max_score > 0 ? Math.round((a.score / a.max_score) * 100) : 0;
                    return (
                      <div key={a.id} className="rounded-xl border border-gray-100 dark:border-slate-700 p-4 bg-gray-50 dark:bg-slate-700/30">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{a.exam_title || a.exam_id}</p>
                            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-mono">{a.exam_id}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-primary-600 dark:text-primary-400">{a.score}<span className="text-xs text-gray-400">/{a.max_score}</span></p>
                            <p className="text-[10px] text-gray-400">{pct}%</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                          <div className="bg-green-50 dark:bg-green-900/20 rounded px-1 py-1.5">
                            <p className="font-bold text-green-600 dark:text-green-400">{a.correct_count}</p>
                            <p className="text-gray-500">Đúng</p>
                          </div>
                          <div className="bg-red-50 dark:bg-red-900/20 rounded px-1 py-1.5">
                            <p className="font-bold text-red-600 dark:text-red-400">{a.wrong_count}</p>
                            <p className="text-gray-500">Sai</p>
                          </div>
                          <div className="bg-gray-100 dark:bg-slate-600/50 rounded px-1 py-1.5">
                            <p className="font-bold text-gray-600 dark:text-gray-300">{a.unanswered_count}</p>
                            <p className="text-gray-500">Trống</p>
                          </div>
                          <div className="bg-blue-50 dark:bg-blue-900/20 rounded px-1 py-1.5">
                            <p className="font-bold text-blue-600 dark:text-blue-400">{Math.floor(a.time_spent_seconds / 60)}'</p>
                            <p className="text-gray-500">Thời gian</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-right">
                          {new Date(a.submitted_at).toLocaleString('vi-VN')}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
