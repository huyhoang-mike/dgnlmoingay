import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineBadgeCheck,
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiOutlineExternalLink,
  HiOutlineFolderOpen,
  HiOutlineLockClosed,
  HiOutlineSearch,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from 'react-icons/hi';
import {
  listMyMaterialSubmissions,
  listOpenMaterials,
  submitOpenMaterial,
} from '../api/client';
import OpenMaterialCard from '../components/OpenMaterialCard';
import OpenMaterialsGuide from '../components/OpenMaterialsGuide';
import { useAuth } from '../contexts/AuthContext';

const SUBJECTS = ['Tất cả', 'Tiếng Việt', 'Tiếng Anh', 'Toán', 'Phân tích số liệu', 'Tư duy logic', 'Hóa học', 'Vật lý', 'Sinh học', 'Lịch sử', 'Địa lý', 'Khác'];
const CATEGORIES = ['Tất cả', 'Đề thi thử', 'Đề thi chính thức', 'Tài liệu chuyên đề', 'Tổng hợp kiến thức', 'Ghi chú (Notes)', 'Thông tin kỳ thi', 'Khác'];
const DRIVE_ROOT_URL = import.meta.env.VITE_OPEN_MATERIALS_DRIVE_ROOT_URL;

const statusLabels = {
  pending: 'Đang chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Cần chỉnh sửa',
};

export default function OpenMaterials() {
  const { isAuthenticated, isEnrolled, isAdmin } = useAuth();
  const [materials, setMaterials] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('Tất cả');
  const [subject, setSubject] = useState('Tất cả');
  const [search, setSearch] = useState('');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    subject: '',
    tags: '',
    source_name: '',
    copyright_note: '',
    copyright_attestation: false,
  });
  const [files, setFiles] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const canAccessRootDrive = isEnrolled || isAdmin;

  const loadMaterials = async () => {
    setLoading(true);
    try {
      const params = {
        ...(category !== 'Tất cả' ? { category } : {}),
        ...(subject !== 'Tất cả' ? { subject } : {}),
        ...(search.trim() ? { q: search.trim() } : {}),
        ...(featuredOnly ? { featured_only: true } : {}),
      };
      const response = await listOpenMaterials(params);
      setMaterials(response.data);
    } catch (err) {
      console.error('[DGNL] Failed to load open materials:', err);
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSubmissions = async () => {
    if (!isAuthenticated) {
      setSubmissions([]);
      return;
    }
    try {
      const response = await listMyMaterialSubmissions();
      setSubmissions(response.data);
    } catch (err) {
      console.error('[DGNL] Failed to load material submissions:', err);
      setSubmissions([]);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, [category, subject, featuredOnly]);

  useEffect(() => {
    loadSubmissions();
  }, [isAuthenticated]);

  const stats = useMemo(() => {
    const featured = materials.filter((material) => material.is_featured).length;
    const pdf = materials.filter((material) => material.file_type === 'pdf').length;
    return { total: materials.length, featured, pdf };
  }, [materials]);

  const handleSearch = (event) => {
    event.preventDefault();
    loadMaterials();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isAuthenticated) {
      setError('Bạn cần đăng nhập Google ở thanh điều hướng trước khi đóng góp tài liệu.');
      return;
    }
    if (!form.copyright_attestation) {
      setError('Bạn cần xác nhận quyền chia sẻ hoặc ghi rõ nguồn tài liệu trước khi gửi.');
      return;
    }
    if (files.length === 0) {
      setError('Vui lòng chọn ít nhất một file PDF hoặc ảnh.');
      return;
    }

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const formData = new FormData();
      formData.append('title', form.title.trim());
      if (form.description) formData.append('description', form.description.trim());
      if (form.category) formData.append('category', form.category);
      if (form.subject) formData.append('subject', form.subject);
      if (form.tags) formData.append('tags', form.tags);
      if (form.source_name) formData.append('source_name', form.source_name.trim());
      if (form.copyright_note) formData.append('copyright_note', form.copyright_note.trim());
      formData.append('copyright_attestation', String(form.copyright_attestation));
      files.forEach((file) => formData.append('files', file));

      await submitOpenMaterial(formData);
      setForm({
        title: '',
        description: '',
        category: '',
        subject: '',
        tags: '',
        source_name: '',
        copyright_note: '',
        copyright_attestation: false,
      });
      setFiles([]);
      setMessage('Đã gửi tài liệu. Admin sẽ kiểm tra bản quyền/nội dung trước khi đưa vào kho công khai.');
      await loadSubmissions();
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(Array.isArray(detail) ? 'Vui lòng kiểm tra lại thông tin tài liệu.' : detail || 'Không thể gửi tài liệu.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      <section className="bg-gradient-to-br from-emerald-600 via-teal-700 to-cyan-800 dark:from-slate-950 dark:via-emerald-950 dark:to-cyan-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-8 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold mb-5">
                <HiOutlineFolderOpen className="h-4 w-4 text-yellow-300" /> Tài liệu ĐGNL công khai
              </div>
              <h1 className="text-3xl sm:text-5xl font-extrabold text-white leading-tight mb-4">
                Kho tài liệu mở: PDF, đề cương và tài liệu luyện thi ĐGNL từ cộng đồng
              </h1>
              <p className="text-lg text-white/80 leading-relaxed max-w-2xl mb-8">
                Xem và tải tài liệu đã được kiểm duyệt miễn phí. Người dùng có thể đóng góp PDF/ảnh để admin xét duyệt, chuẩn hóa và đưa vào Google Drive công khai.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href="#material-list"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors shadow-lg shadow-black/10"
                >
                  Xem tài liệu <HiOutlineArrowRight className="h-5 w-5" />
                </a>
                <a
                  href="#contribute-material"
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold hover:bg-white/20 transition-colors"
                >
                  Đóng góp tài liệu
                </a>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {[
                { label: 'Tài liệu', value: stats.total, icon: HiOutlineDocumentText },
                { label: 'Nổi bật', value: stats.featured, icon: HiOutlineStar },
                { label: 'PDF', value: stats.pdf, icon: HiOutlineCloudUpload },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-4 text-center">
                  <item.icon className="h-6 w-6 text-white/80 mx-auto mb-2" />
                  <p className="text-2xl font-extrabold text-white">{item.value}</p>
                  <p className="text-xs text-white/70">{item.label}</p>
                </div>
              ))}
              <div className="col-span-3 rounded-2xl bg-white/10 border border-white/15 backdrop-blur p-5">
                <p className="text-sm font-bold text-white mb-2">Hạ tầng tiết kiệm</p>
                <p className="text-sm text-white/75 leading-relaxed">
                  Catalog lưu trong database, file công khai trên Google Drive, file đóng góp lưu tạm trên VPS để kiểm duyệt bản quyền.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <OpenMaterialsGuide />

        <section className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr] gap-5 mb-10">
          <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Quyền lợi học viên</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
              Học viên được ưu tiên duyệt tài liệu đóng góp, có badge ưu tiên trong hàng chờ và được truy cập thư mục Drive gốc nếu admin đã cấu hình link.
            </p>
            {canAccessRootDrive ? (
              DRIVE_ROOT_URL ? (
                <a
                  href={DRIVE_ROOT_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 transition-colors"
                >
                  Mở thư mục Drive học viên <HiOutlineExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <div className="rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800/30 p-4 text-sm text-blue-800 dark:text-blue-200">
                  Tài khoản của bạn đủ điều kiện truy cập thư mục Drive gốc. Admin cần cấu hình biến VITE_OPEN_MATERIALS_DRIVE_ROOT_URL khi deploy.
                </div>
              )
            ) : (
              <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-4 text-sm text-yellow-800 dark:text-yellow-200">
                <HiOutlineLockClosed className="inline h-4 w-4 mr-1" /> Đăng ký khóa học để có quyền ưu tiên và truy cập thư mục tài liệu đầy đủ hơn.
              </div>
            )}
            <Link
              to="/dang-ky"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
            >
              Xem khóa học <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <form id="contribute-material" onSubmit={handleSubmit} className="scroll-mt-24 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6 space-y-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Đóng góp tài liệu</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                Upload PDF/ảnh để admin kiểm tra. Nếu phù hợp, tài liệu sẽ được chuyển vào Google Drive công khai và hiển thị trong kho.
              </p>
            </div>
            {!isAuthenticated && (
              <div className="rounded-xl bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 p-4 text-sm text-yellow-800 dark:text-yellow-200">
                Bạn cần đăng nhập Google ở thanh điều hướng để đóng góp tài liệu.
              </div>
            )}
            {(isEnrolled || isAdmin) && (
              <div className="rounded-xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800/30 p-4 text-sm text-emerald-800 dark:text-emerald-200">
                <HiOutlineBadgeCheck className="inline h-4 w-4 mr-1" /> Tài liệu của học viên được gắn ưu tiên trong hàng chờ duyệt.
              </div>
            )}
            {message && (
              <div className="rounded-xl bg-green-50 dark:bg-green-900/10 border border-green-200 dark:border-green-800/30 p-3 text-sm text-green-700 dark:text-green-300">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/30 p-3 text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Tên tài liệu</label>
                <input
                  value={form.title}
                  onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
                  required
                  minLength={5}
                  maxLength={255}
                  placeholder="Ví dụ: Tổng hợp công thức Toán ĐGNL phần biểu đồ"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Nhóm tài liệu</label>
                <select
                  value={form.category}
                  onChange={(event) => setForm((prev) => ({ ...prev, category: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Chưa phân loại</option>
                  {CATEGORIES.filter((item) => item !== 'Tất cả').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Môn/phần</label>
                <select
                  value={form.subject}
                  onChange={(event) => setForm((prev) => ({ ...prev, subject: event.target.value }))}
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Chưa phân loại</option>
                  {SUBJECTS.filter((item) => item !== 'Tất cả').map((item) => <option key={item} value={item}>{item}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Mô tả ngắn</label>
                <textarea
                  value={form.description}
                  onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                  rows={4}
                  maxLength={5000}
                  placeholder="Tài liệu gồm những phần nào, phù hợp cho ai, cách sử dụng..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Nguồn/tác giả</label>
                <input
                  value={form.source_name}
                  onChange={(event) => setForm((prev) => ({ ...prev, source_name: event.target.value }))}
                  placeholder="Tên bạn, nhóm biên soạn hoặc nguồn gốc"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Hashtag</label>
                <input
                  value={form.tags}
                  onChange={(event) => setForm((prev) => ({ ...prev, tags: event.target.value }))}
                  placeholder="vd: biểu đồ, reading, công thức"
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">Ghi chú bản quyền/giấy phép</label>
                <textarea
                  value={form.copyright_note}
                  onChange={(event) => setForm((prev) => ({ ...prev, copyright_note: event.target.value }))}
                  rows={3}
                  placeholder="Ví dụ: tự biên soạn, được tác giả cho phép chia sẻ, trích nguồn rõ ràng..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-3 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 mb-1">File PDF/ảnh</label>
                <input
                  type="file"
                  accept="application/pdf,image/png,image/jpeg,image/webp"
                  multiple
                  onChange={(event) => setFiles(Array.from(event.target.files || []).slice(0, 5))}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-primary-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-700 hover:file:bg-primary-100"
                />
                {files.length > 0 && (
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Đã chọn {files.length} file. Mỗi file tối đa 20MB.</p>
                )}
              </div>
            </div>
            <label className="flex items-start gap-3 rounded-xl border border-gray-200 dark:border-slate-600 p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.copyright_attestation}
                onChange={(event) => setForm((prev) => ({ ...prev, copyright_attestation: event.target.checked }))}
                className="mt-1"
              />
              <span className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                Tôi xác nhận tài liệu có quyền chia sẻ công khai hoặc đã ghi rõ nguồn/giấy phép để admin kiểm tra trước khi publish.
              </span>
            </label>
            <button
              type="submit"
              disabled={submitting || !isAuthenticated}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? 'Đang gửi...' : 'Gửi tài liệu chờ duyệt'} <HiOutlineArrowRight className="h-4 w-4" />
            </button>
          </form>
        </section>

        {isAuthenticated && submissions.length > 0 && (
          <section className="mb-10 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Tài liệu bạn đã đóng góp</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {submissions.slice(0, 4).map((submission) => (
                <div key={submission.id} className="rounded-xl bg-gray-50 dark:bg-slate-900/60 border border-gray-100 dark:border-slate-700 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white">{submission.title}</h3>
                    <span className="px-2 py-0.5 rounded-full bg-white dark:bg-slate-800 text-[11px] font-bold text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700">
                      {statusLabels[submission.status] || submission.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {submission.file_urls.length} file • {submission.is_priority ? 'Ưu tiên học viên' : 'Chờ theo thứ tự'}
                  </p>
                  {submission.admin_notes && (
                    <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">Ghi chú admin: {submission.admin_notes}</p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section id="material-list" className="scroll-mt-24">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4 mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tài liệu mới nhất</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Các file công khai đều đã qua bước kiểm tra nội dung và bản quyền cơ bản.
              </p>
            </div>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Tìm tài liệu..."
                  className="w-full rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 pl-9 pr-3 py-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <button className="px-4 py-2.5 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700">
                Tìm
              </button>
            </form>
          </div>

          <div className="flex flex-wrap gap-2 mb-5">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  category === item
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                }`}
              >
                {item}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mb-6">
            {SUBJECTS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSubject(item)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  subject === item
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-emerald-200 dark:hover:border-emerald-700'
                }`}
              >
                {item}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setFeaturedOnly((prev) => !prev)}
              className={`inline-flex items-center gap-1 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                featuredOnly
                  ? 'bg-yellow-500 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-slate-700 hover:border-yellow-200 dark:hover:border-yellow-700'
              }`}
            >
              <HiOutlineStar className="h-4 w-4" /> Nổi bật
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2, 3, 4].map((item) => (
                <div key={item} className="h-64 rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 animate-pulse" />
              ))}
            </div>
          ) : materials.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {materials.map((material) => <OpenMaterialCard key={material.id} material={material} />)}
            </div>
          ) : (
            <div className="rounded-2xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 p-10 text-center">
              <HiOutlineDocumentText className="h-12 w-12 mx-auto text-gray-300 dark:text-slate-600 mb-3" />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Chưa có tài liệu phù hợp</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                Hãy thử bỏ bộ lọc hoặc đóng góp tài liệu đầu tiên cho chủ đề này.
              </p>
              <a
                href="#contribute-material"
                className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary-600 text-white text-sm font-bold hover:bg-primary-700"
              >
                Đóng góp tài liệu <HiOutlineArrowRight className="h-4 w-4" />
              </a>
            </div>
          )}
        </section>

        <section className="mt-10 rounded-2xl bg-slate-900 dark:bg-slate-950 text-white p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-5 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-3">
                <HiOutlineShieldCheck className="h-4 w-4" /> COPYRIGHT-FIRST
              </div>
              <h2 className="text-2xl font-bold mb-2">Tài liệu bên thứ ba không tự động công khai</h2>
              <p className="text-sm text-white/75 leading-relaxed max-w-3xl">
                Mọi tài liệu người dùng upload sẽ ở trạng thái chờ duyệt. Admin chỉ publish khi nguồn rõ ràng, được phép chia sẻ hoặc đã thay thế bằng bản tự biên soạn/phù hợp.
              </p>
            </div>
            <Link
              to="/hoi-dap"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white text-slate-900 text-sm font-bold hover:bg-gray-50 transition-colors"
            >
              Cần hỏi bài? Vào Q&A <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
