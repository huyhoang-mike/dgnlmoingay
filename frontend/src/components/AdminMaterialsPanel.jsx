/**
 * AdminMaterialsPanel
 * Admin tab to manage the Open Materials catalog + community submissions:
 *  - Review (approve / reject / publish) submissions
 *  - Edit / delete / feature published materials
 *  - Manually add a new Google Drive material
 *
 * Used inside AdminPanel.jsx via a new "Tài liệu" tab.
 */

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  HiOutlineDocumentText,
  HiOutlineExternalLink,
  HiOutlineEye,
  HiOutlineEyeOff,
  HiOutlinePencil,
  HiOutlinePlus,
  HiOutlineRefresh,
  HiOutlineSearch,
  HiOutlineStar,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCheck,
  HiOutlineExclamationCircle,
  HiOutlineUser,
} from 'react-icons/hi';
import {
  createOpenMaterial,
  deleteMaterialSubmission,
  deleteOpenMaterial,
  listMaterialSubmissionsAdmin,
  listOpenMaterials,
  reviewMaterialSubmission,
  updateOpenMaterial,
} from '../api/client';

const SUB_TABS = [
  { key: 'pending', label: 'Chờ duyệt' },
  { key: 'all-submissions', label: 'Tất cả gửi lên' },
  { key: 'catalog', label: 'Kho công khai' },
  { key: 'add', label: 'Thêm tài liệu mới' },
];

const SUBJECT_OPTIONS = [
  '', 'Tiếng Việt', 'Tiếng Anh', 'Toán', 'Phân tích số liệu', 'Tư duy logic',
  'Hóa học', 'Vật lý', 'Sinh học', 'Lịch sử', 'Địa lý', 'Khác',
];
const CATEGORY_OPTIONS = [
  '', 'Đề thi thử', 'Đề thi chính thức', 'Tài liệu chuyên đề',
  'Tổng hợp kiến thức', 'Ghi chú (Notes)', 'Thông tin kỳ thi', 'Khác',
];

const STATUS_BADGE = {
  pending:  'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  approved: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
};

const STATUS_LABEL = {
  pending: 'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

const blankForm = {
  title: '',
  description: '',
  category: '',
  subject: '',
  tags: '',
  file_type: 'pdf',
  drive_url: '',
  preview_image_url: '',
  source_name: '',
  copyright_note: '',
  is_published: true,
  is_featured: false,
};

export default function AdminMaterialsPanel({ showToast }) {
  const [subTab, setSubTab] = useState('pending');

  // ── Submissions ──────────────────────────
  const [submissions, setSubmissions] = useState([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);
  const [reviewingId, setReviewingId] = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // {submission, mode: 'approve'|'reject'}
  const [reviewForm, setReviewForm] = useState({
    admin_notes: '',
    drive_url: '',
    publish_to_catalog: true,
    is_featured: false,
  });

  // ── Catalog ──────────────────────────────
  const [materials, setMaterials] = useState([]);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogFilter, setCatalogFilter] = useState('all'); // 'all' | 'published' | 'hidden' | 'featured'
  const [editingMaterial, setEditingMaterial] = useState(null);
  const [editForm, setEditForm] = useState(blankForm);
  const [editLoading, setEditLoading] = useState(false);

  // ── Add new ──────────────────────────────
  const [createForm, setCreateForm] = useState(blankForm);
  const [createLoading, setCreateLoading] = useState(false);

  // ── Fetch helpers ────────────────────────
  const fetchSubmissions = useCallback(async () => {
    setSubmissionsLoading(true);
    try {
      const res = await listMaterialSubmissionsAdmin();
      setSubmissions(res.data);
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi tải submissions', 'error');
    } finally {
      setSubmissionsLoading(false);
    }
  }, [showToast]);

  const fetchMaterials = useCallback(async () => {
    setMaterialsLoading(true);
    try {
      // published_only=false so admin sees hidden items too
      const res = await listOpenMaterials({ published_only: false });
      setMaterials(res.data);
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi tải catalog', 'error');
    } finally {
      setMaterialsLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    if (subTab === 'pending' || subTab === 'all-submissions') fetchSubmissions();
    if (subTab === 'catalog') fetchMaterials();
  }, [subTab, fetchSubmissions, fetchMaterials]);

  // ── Submission filter ────────────────────
  const visibleSubmissions = useMemo(() => {
    if (subTab === 'pending') return submissions.filter((s) => s.status === 'pending');
    return submissions;
  }, [submissions, subTab]);

  // ── Catalog filter ───────────────────────
  const visibleMaterials = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    return materials.filter((m) => {
      if (catalogFilter === 'published' && !m.is_published) return false;
      if (catalogFilter === 'hidden' && m.is_published) return false;
      if (catalogFilter === 'featured' && !m.is_featured) return false;
      if (!q) return true;
      return (
        m.title?.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q) ||
        m.subject?.toLowerCase().includes(q) ||
        m.category?.toLowerCase().includes(q)
      );
    });
  }, [materials, catalogSearch, catalogFilter]);

  // ── Stats ────────────────────────────────
  const stats = useMemo(() => ({
    pending: submissions.filter((s) => s.status === 'pending').length,
    published: materials.filter((m) => m.is_published).length,
    featured: materials.filter((m) => m.is_featured).length,
    totalDownloads: materials.reduce((sum, m) => sum + (m.download_count || 0), 0),
  }), [submissions, materials]);

  // ── Review actions ───────────────────────
  const openReview = (submission, mode) => {
    setReviewModal({ submission, mode });
    setReviewForm({
      admin_notes: '',
      drive_url: submission.file_urls?.[0] || '',
      publish_to_catalog: mode === 'approve',
      is_featured: false,
    });
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    const status = reviewModal.mode === 'approve' ? 'approved' : 'rejected';
    if (status === 'approved' && reviewForm.publish_to_catalog && !reviewForm.drive_url.trim()) {
      showToast?.('Cần Drive URL để publish lên catalog', 'error');
      return;
    }
    try {
      setReviewingId(reviewModal.submission.id);
      const res = await reviewMaterialSubmission(reviewModal.submission.id, {
        status,
        admin_notes: reviewForm.admin_notes.trim() || null,
        publish_to_catalog: status === 'approved' && reviewForm.publish_to_catalog,
        drive_url: reviewForm.drive_url.trim() || null,
        is_featured: reviewForm.is_featured,
      });
      setSubmissions((prev) => prev.map((s) => (s.id === res.data.id ? res.data : s)));
      showToast?.(`✅ Đã ${status === 'approved' ? 'duyệt' : 'từ chối'} submission`);
      setReviewModal(null);
      if (status === 'approved' && reviewForm.publish_to_catalog) fetchMaterials();
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi duyệt submission', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  const handleDeleteSubmission = async (submission) => {
    if (!window.confirm(`Xóa submission "${submission.title}"? Hành động không thể hoàn tác.`)) return;
    try {
      setReviewingId(submission.id);
      await deleteMaterialSubmission(submission.id);
      setSubmissions((prev) => prev.filter((s) => s.id !== submission.id));
      showToast?.('🗑️ Đã xóa submission');
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi xóa', 'error');
    } finally {
      setReviewingId(null);
    }
  };

  // ── Catalog actions ──────────────────────
  const openEdit = (material) => {
    setEditingMaterial(material);
    setEditForm({
      ...blankForm,
      ...material,
      tags: Array.isArray(material.tags) ? material.tags.join(', ') : '',
    });
  };

  const handleQuickToggle = async (material, field) => {
    try {
      const res = await updateOpenMaterial(material.id, { [field]: !material[field] });
      setMaterials((prev) => prev.map((m) => (m.id === res.data.id ? res.data : m)));
      showToast?.('✅ Đã cập nhật');
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi cập nhật', 'error');
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingMaterial) return;
    try {
      setEditLoading(true);
      const payload = {
        title: editForm.title.trim(),
        description: editForm.description?.trim() || null,
        category: editForm.category || null,
        subject: editForm.subject || null,
        tags: editForm.tags
          ? editForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        file_type: editForm.file_type || 'pdf',
        drive_url: editForm.drive_url.trim(),
        preview_image_url: editForm.preview_image_url?.trim() || null,
        source_name: editForm.source_name?.trim() || null,
        copyright_note: editForm.copyright_note?.trim() || null,
        is_published: !!editForm.is_published,
        is_featured: !!editForm.is_featured,
      };
      const res = await updateOpenMaterial(editingMaterial.id, payload);
      setMaterials((prev) => prev.map((m) => (m.id === res.data.id ? res.data : m)));
      showToast?.('✅ Đã lưu thay đổi');
      setEditingMaterial(null);
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi lưu thay đổi', 'error');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteMaterial = async (material) => {
    if (!window.confirm(`Xóa tài liệu "${material.title}" khỏi catalog? Hành động không thể hoàn tác.`)) return;
    try {
      await deleteOpenMaterial(material.id);
      setMaterials((prev) => prev.filter((m) => m.id !== material.id));
      showToast?.('🗑️ Đã xóa tài liệu');
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi xóa', 'error');
    }
  };

  // ── Create new material ──────────────────
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!createForm.title.trim() || !createForm.drive_url.trim()) {
      showToast?.('Cần nhập tiêu đề và Drive URL', 'error');
      return;
    }
    try {
      setCreateLoading(true);
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description?.trim() || null,
        category: createForm.category || null,
        subject: createForm.subject || null,
        tags: createForm.tags
          ? createForm.tags.split(',').map((t) => t.trim()).filter(Boolean)
          : [],
        file_type: createForm.file_type || 'pdf',
        drive_url: createForm.drive_url.trim(),
        preview_image_url: createForm.preview_image_url?.trim() || null,
        source_name: createForm.source_name?.trim() || null,
        copyright_note: createForm.copyright_note?.trim() || null,
        is_published: !!createForm.is_published,
        is_featured: !!createForm.is_featured,
      };
      await createOpenMaterial(payload);
      showToast?.('✅ Đã thêm tài liệu vào catalog');
      setCreateForm(blankForm);
      // Pre-load catalog when user switches
      fetchMaterials();
      setSubTab('catalog');
    } catch (err) {
      showToast?.(err?.response?.data?.detail || 'Lỗi tạo tài liệu', 'error');
    } finally {
      setCreateLoading(false);
    }
  };

  // ════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════
  return (
    <>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Chờ duyệt" value={stats.pending} icon="⏳" tint="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-300" />
        <StatCard label="Đã publish" value={stats.published} icon="📚" tint="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300" />
        <StatCard label="Nổi bật" value={stats.featured} icon="⭐" tint="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-300" />
        <StatCard label="Lượt tải" value={stats.totalDownloads} icon="⬇️" tint="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-300" />
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap gap-1 bg-white dark:bg-slate-800 rounded-xl p-1.5 mb-6 border border-gray-100 dark:border-slate-700 shadow-sm">
        {SUB_TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setSubTab(t.key)}
            className={`flex-1 min-w-[140px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
              subTab === t.key
                ? 'bg-primary-600 text-white shadow-md'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700'
            }`}
          >
            {t.label}
            {t.key === 'pending' && stats.pending > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${subTab === t.key ? 'bg-white/20 text-white' : 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'}`}>
                {stats.pending}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SUB-TAB: PENDING & ALL SUBMISSIONS ── */}
      {(subTab === 'pending' || subTab === 'all-submissions') && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={fetchSubmissions} disabled={submissionsLoading}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
              <HiOutlineRefresh className={`h-4 w-4 ${submissionsLoading ? 'animate-spin' : ''}`} /> Tải lại
            </button>
          </div>

          {submissionsLoading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : visibleSubmissions.length === 0 ? (
            <EmptyState
              icon={<HiOutlineDocumentText className="h-12 w-12" />}
              title={subTab === 'pending' ? 'Không có submission chờ duyệt' : 'Chưa có submission nào'}
              hint="Học viên có thể đóng góp PDF/ảnh ở trang Kho tài liệu mở."
            />
          ) : (
            <div className="space-y-3">
              {visibleSubmissions.map((s) => (
                <SubmissionRow
                  key={s.id}
                  submission={s}
                  busy={reviewingId === s.id}
                  onApprove={() => openReview(s, 'approve')}
                  onReject={() => openReview(s, 'reject')}
                  onDelete={() => handleDeleteSubmission(s)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB: CATALOG ── */}
      {subTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={catalogSearch}
                  onChange={(e) => setCatalogSearch(e.target.value)}
                  placeholder="Tìm theo tên / mô tả / môn / category..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                />
              </div>
              <div className="flex gap-1 bg-gray-100 dark:bg-slate-700 rounded-lg p-1">
                {[
                  { key: 'all', label: 'Tất cả' },
                  { key: 'published', label: 'Đang hiện' },
                  { key: 'hidden', label: 'Đang ẩn' },
                  { key: 'featured', label: 'Nổi bật' },
                ].map((f) => (
                  <button key={f.key} onClick={() => setCatalogFilter(f.key)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${catalogFilter === f.key ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                    {f.label}
                  </button>
                ))}
              </div>
              <button onClick={fetchMaterials} disabled={materialsLoading}
                className="p-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors" title="Tải lại">
                <HiOutlineRefresh className={`h-4 w-4 ${materialsLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {materialsLoading ? (
            <div className="flex justify-center py-16"><div className="w-8 h-8 border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 rounded-full animate-spin" /></div>
          ) : visibleMaterials.length === 0 ? (
            <EmptyState
              icon={<HiOutlineDocumentText className="h-12 w-12" />}
              title="Không có tài liệu phù hợp"
              hint='Thử đổi bộ lọc hoặc thêm mới ở tab "Thêm tài liệu mới".'
            />
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tài liệu</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Phân loại</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lượt tải</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Nổi bật</th>
                      <th className="text-center px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hiển thị</th>
                      <th className="text-right px-5 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                    {visibleMaterials.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30 transition-colors">
                        <td className="px-5 py-4 max-w-xs">
                          <div className="flex items-start gap-2">
                            <span className="text-lg">{m.file_type === 'image' ? '🖼️' : '📄'}</span>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{m.title}</p>
                              {m.description && <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{m.description}</p>}
                              {Array.isArray(m.tags) && m.tags.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {m.tags.slice(0, 4).map((t, i) => (
                                    <span key={i} className="px-1.5 py-0.5 rounded text-[10px] bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">#{t}</span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-xs text-gray-600 dark:text-gray-300">
                            {m.category && <div className="font-medium">{m.category}</div>}
                            {m.subject && <div className="text-gray-400 dark:text-gray-500">{m.subject}</div>}
                            {!m.category && !m.subject && <span className="text-gray-300">—</span>}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{m.download_count || 0}</span>
                        </td>
                        <td className="px-5 py-4 text-center">
                          <ToggleSwitch checked={m.is_featured} onClick={() => handleQuickToggle(m, 'is_featured')} color="bg-yellow-500" />
                        </td>
                        <td className="px-5 py-4 text-center">
                          <ToggleSwitch checked={m.is_published} onClick={() => handleQuickToggle(m, 'is_published')} color="bg-blue-500" />
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a href={m.drive_url} target="_blank" rel="noopener noreferrer"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors" title="Mở Drive">
                              <HiOutlineExternalLink className="h-4 w-4" />
                            </a>
                            <button onClick={() => openEdit(m)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors" title="Chỉnh sửa">
                              <HiOutlinePencil className="h-4 w-4" />
                            </button>
                            <button onClick={() => handleDeleteMaterial(m)}
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Xóa">
                              <HiOutlineTrash className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-3 bg-gray-50 dark:bg-slate-700/50 border-t border-gray-100 dark:border-slate-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">Hiển thị {visibleMaterials.length} / {materials.length} tài liệu</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB: ADD NEW ── */}
      {subTab === 'add' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <HiOutlinePlus className="h-4 w-4 text-primary-600" /> Thêm tài liệu vào catalog
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
            Dùng cho tài liệu admin tự upload lên Drive. Với submission từ học viên, hãy dùng tab "Chờ duyệt".
          </p>
          <MaterialForm
            form={createForm}
            setForm={setCreateForm}
            onSubmit={handleCreateSubmit}
            loading={createLoading}
            submitLabel="Thêm tài liệu"
          />
        </div>
      )}

      {/* ── REVIEW MODAL ── */}
      {reviewModal && (
        <Modal title={reviewModal.mode === 'approve' ? 'Duyệt submission' : 'Từ chối submission'} onClose={() => setReviewModal(null)}>
          <form onSubmit={handleReviewSubmit} className="p-6 space-y-4">
            <div className="rounded-xl bg-gray-50 dark:bg-slate-700/40 p-3 text-xs space-y-1">
              <p><strong className="text-gray-900 dark:text-white">{reviewModal.submission.title}</strong></p>
              {reviewModal.submission.description && (
                <p className="text-gray-600 dark:text-gray-300">{reviewModal.submission.description}</p>
              )}
              <p className="text-gray-500 dark:text-gray-400">
                Gửi bởi: {reviewModal.submission.contributor?.name} · {reviewModal.submission.contributor?.is_enrolled ? '🎓 Học viên' : '👤 Khách'}
              </p>
              {Array.isArray(reviewModal.submission.file_urls) && reviewModal.submission.file_urls.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {reviewModal.submission.file_urls.map((url, i) => (
                    <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1 rounded bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-[11px] text-primary-600 dark:text-primary-300 hover:underline">
                      <HiOutlineExternalLink className="h-3 w-3" /> {reviewModal.submission.original_filenames?.[i] || `file-${i + 1}`}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {reviewModal.mode === 'approve' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Drive URL công khai *</label>
                  <input
                    type="url"
                    value={reviewForm.drive_url}
                    onChange={(e) => setReviewForm({ ...reviewForm, drive_url: e.target.value })}
                    placeholder="https://drive.google.com/file/d/..."
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                    required={reviewForm.publish_to_catalog}
                  />
                  <p className="mt-1 text-[11px] text-gray-400 dark:text-gray-500">
                    Khuyến nghị: tải file học viên gửi lên Drive admin trước, rồi dán URL ở đây. Mặc định dùng URL upload đầu tiên.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={reviewForm.publish_to_catalog}
                      onChange={(e) => setReviewForm({ ...reviewForm, publish_to_catalog: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                    <span className="text-gray-700 dark:text-gray-300">Publish luôn vào catalog</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="checkbox" checked={reviewForm.is_featured}
                      onChange={(e) => setReviewForm({ ...reviewForm, is_featured: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
                    <span className="text-gray-700 dark:text-gray-300">Đánh dấu nổi bật</span>
                  </label>
                </div>
              </>
            )}

            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ghi chú cho người gửi (tùy chọn)</label>
              <textarea
                rows={3}
                value={reviewForm.admin_notes}
                onChange={(e) => setReviewForm({ ...reviewForm, admin_notes: e.target.value })}
                placeholder={reviewModal.mode === 'approve' ? 'vd: Cảm ơn bạn, đã thêm vào kho.' : 'vd: Tài liệu trùng nguồn đã có sẵn, vui lòng xem lại.'}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={reviewingId === reviewModal.submission.id}
                className={`flex-1 px-4 py-2.5 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 ${
                  reviewModal.mode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                }`}>
                {reviewingId === reviewModal.submission.id ? 'Đang lưu...' : (reviewModal.mode === 'approve' ? '✅ Duyệt' : '❌ Từ chối')}
              </button>
              <button type="button" onClick={() => setReviewModal(null)}
                className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Hủy
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* ── EDIT MODAL ── */}
      {editingMaterial && (
        <Modal title="Chỉnh sửa tài liệu" onClose={() => setEditingMaterial(null)} maxWidth="max-w-2xl">
          <div className="p-6">
            <MaterialForm
              form={editForm}
              setForm={setEditForm}
              onSubmit={handleEditSubmit}
              loading={editLoading}
              submitLabel="Lưu thay đổi"
              onCancel={() => setEditingMaterial(null)}
            />
          </div>
        </Modal>
      )}
    </>
  );
}

/* ── Sub-components ──────────────────────── */

function StatCard({ label, value, icon, tint }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl ${tint}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, hint }) {
  return (
    <div className="text-center py-16 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700">
      <div className="text-gray-300 dark:text-gray-600 mx-auto mb-3 inline-flex">{icon}</div>
      <p className="text-gray-700 dark:text-gray-300 font-medium mb-1">{title}</p>
      {hint && <p className="text-xs text-gray-500 dark:text-gray-400">{hint}</p>}
    </div>
  );
}

function ToggleSwitch({ checked, onClick, color = 'bg-blue-500' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative inline-flex w-10 h-6 rounded-full transition-colors ${checked ? color : 'bg-gray-300 dark:bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function Modal({ title, children, onClose, maxWidth = 'max-w-lg' }) {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}>
        <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">{title}</h3>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600">
            <HiOutlineX className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function SubmissionRow({ submission, busy, onApprove, onReject, onDelete }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-2">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white">{submission.title}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${STATUS_BADGE[submission.status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABEL[submission.status] || submission.status}
            </span>
            {submission.is_priority && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                🎓 Học viên
              </span>
            )}
            {submission.published_material_id && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">
                Đã publish #{submission.published_material_id}
              </span>
            )}
          </div>

          {submission.description && (
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">{submission.description}</p>
          )}

          <div className="flex items-center flex-wrap gap-3 text-[11px] text-gray-500 dark:text-gray-400 mb-2">
            <span className="inline-flex items-center gap-1">
              <HiOutlineUser className="h-3 w-3" />
              {submission.contributor?.name} ({submission.contributor?.id})
            </span>
            {submission.category && <span>📁 {submission.category}</span>}
            {submission.subject && <span>📚 {submission.subject}</span>}
            {submission.source_name && <span>🏷️ {submission.source_name}</span>}
            <span>{new Date(submission.created_at).toLocaleString('vi-VN')}</span>
          </div>

          {Array.isArray(submission.file_urls) && submission.file_urls.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-2">
              {submission.file_urls.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 dark:border-slate-600 text-[11px] text-primary-600 dark:text-primary-300 hover:underline">
                  <HiOutlineExternalLink className="h-3 w-3" /> {submission.original_filenames?.[i] || `file-${i + 1}`}
                </a>
              ))}
            </div>
          )}

          {submission.admin_notes && (
            <div className="text-[11px] text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/40 rounded-lg px-2 py-1.5">
              <strong>Ghi chú admin:</strong> {submission.admin_notes}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col lg:w-40">
          {submission.status === 'pending' && (
            <>
              <button onClick={onApprove} disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700 disabled:opacity-50">
                <HiOutlineCheck className="h-4 w-4" /> Duyệt & Publish
              </button>
              <button onClick={onReject} disabled={busy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50">
                <HiOutlineExclamationCircle className="h-4 w-4" /> Từ chối
              </button>
            </>
          )}
          <button onClick={onDelete} disabled={busy}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-xs font-medium hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-50">
            <HiOutlineTrash className="h-4 w-4" /> Xóa
          </button>
        </div>
      </div>
    </div>
  );
}

function MaterialForm({ form, setForm, onSubmit, loading, submitLabel, onCancel }) {
  const set = (field, value) => setForm({ ...form, [field]: value });
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tiêu đề *</label>
          <input required type="text" value={form.title} onChange={(e) => set('title', e.target.value)}
            placeholder="Vd: Đề thi thử ĐGNL HCM 2025 — Chuyên ĐHSP"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Mô tả ngắn</label>
          <textarea rows={2} value={form.description || ''} onChange={(e) => set('description', e.target.value)}
            placeholder="Tóm tắt nội dung, số trang, ghi chú đáp án..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Phân loại (category)</label>
          <select value={form.category || ''} onChange={(e) => set('category', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c || '— Không —'}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Môn học (subject)</label>
          <select value={form.subject || ''} onChange={(e) => set('subject', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            {SUBJECT_OPTIONS.map((s) => <option key={s} value={s}>{s || '— Không —'}</option>)}
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Loại file</label>
          <select value={form.file_type || 'pdf'} onChange={(e) => set('file_type', e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none">
            <option value="pdf">PDF</option>
            <option value="image">Hình ảnh</option>
            <option value="folder">Folder Drive</option>
            <option value="doc">DOC / DOCX</option>
            <option value="other">Khác</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Tags (phân tách bằng dấu phẩy)</label>
          <input type="text" value={form.tags || ''} onChange={(e) => set('tags', e.target.value)}
            placeholder="vd: dgnl, tieng-viet, lop-12"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Drive URL *</label>
          <input required type="url" value={form.drive_url} onChange={(e) => set('drive_url', e.target.value)}
            placeholder="https://drive.google.com/file/d/.../view"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ảnh preview (URL)</label>
          <input type="url" value={form.preview_image_url || ''} onChange={(e) => set('preview_image_url', e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nguồn (source name)</label>
          <input type="text" value={form.source_name || ''} onChange={(e) => set('source_name', e.target.value)}
            placeholder="vd: Cộng đồng / Sách XYZ / Thầy ABC"
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Ghi chú bản quyền</label>
          <textarea rows={2} value={form.copyright_note || ''} onChange={(e) => set('copyright_note', e.target.value)}
            placeholder="Ghi chú cho thấy nguồn / quyền chia sẻ..."
            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-gray-50 dark:bg-slate-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
        </div>
      </div>

      <div className="flex flex-wrap gap-6 pt-2">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!form.is_published} onChange={(e) => set('is_published', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
          <span className="text-gray-700 dark:text-gray-300"><HiOutlineEye className="inline h-4 w-4 mr-1" />Hiển thị công khai</span>
        </label>
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={!!form.is_featured} onChange={(e) => set('is_featured', e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-yellow-500 focus:ring-yellow-400" />
          <span className="text-gray-700 dark:text-gray-300"><HiOutlineStar className="inline h-4 w-4 mr-1" />Đánh dấu nổi bật</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-5 py-2.5 rounded-lg bg-primary-600 text-white text-sm font-medium hover:bg-primary-700 transition-colors disabled:opacity-50">
          {loading ? 'Đang lưu...' : submitLabel}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
            Hủy
          </button>
        )}
      </div>
    </form>
  );
}
