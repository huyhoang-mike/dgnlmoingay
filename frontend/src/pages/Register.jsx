/**
 * Register Page
 * SePay registration flow with dynamic QR, payment polling, and auto-enrollment.
 */

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HiOutlineCheckCircle,
  HiOutlineClock,
  HiOutlineClipboard,
  HiOutlineCreditCard,
  HiOutlineExclamationCircle,
  HiOutlineMail,
  HiOutlineRefresh,
  HiOutlineUserGroup,
  HiOutlinePhone,
  HiOutlineSparkles,
  HiOutlineShieldCheck,
  HiOutlineLightningBolt,
  HiOutlineAcademicCap,
  HiOutlineChatAlt2,
  HiOutlineDocumentText,
  HiOutlineClipboardCheck,
  HiOutlineStar,
  HiOutlineGift,
  HiOutlineFire,
  HiX,
} from 'react-icons/hi';
import {
  bindPaymentOrderEmail,
  createPaymentOrder,
  getPaymentOrderStatus,
} from '../api/client';
import { useAuth } from '../contexts/AuthContext';

const STEPS = [
  {
    icon: HiOutlineCreditCard,
    step: 1,
    title: 'Tạo mã QR chuyển khoản',
    desc: 'Nhập email Google, hệ thống tạo QR và mã chuyển khoản tự động',
  },
  {
    icon: HiOutlineMail,
    step: 2,
    title: 'Xác nhận thanh toán tự động',
    desc: 'Sau khi chuyển khoản thành công, hệ thống sẽ xác nhận ngay trên trang.',
  },
  {
    icon: HiOutlineUserGroup,
    step: 3,
    title: 'Học ngay lập tức',
    desc: 'Truy cập khóa học, nhóm Zalo ôn tập ĐGNL cùng với video hướng dẫn sử dụng.',
  },
];

const BENEFITS = [
  {
    icon: HiOutlineAcademicCap,
    title: 'Toàn bộ bài giảng Nền tảng & Luyện đề',
    desc: '100+ video bài giảng theo lộ trình 2 giai đoạn cho 10 môn học. Truy cập trọn đời, học không giới hạn.',
    highlight: true,
  },
  {
    icon: HiOutlineClipboardCheck,
    title: '100+ đề thi thử chuẩn cấu trúc 2026',
    desc: 'Đề chính thức ĐHQG-HCM các năm + đề thi thử theo cấu trúc V-ACT mới. Có chấm điểm và đáp án video.',
    highlight: true,
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Quiz luyện chuyên sâu theo dạng bài',
    desc: 'Toàn bộ quiz Tiếng Việt, Tiếng Anh, Toán, phân tích số liệu, logic — luyện đến khi nào thuần thục.',
  },
  {
    icon: HiOutlineDocumentText,
    title: 'Kho Drive tài liệu mở "VIP"',
    desc: 'Tài liệu chuyên đề, ebook, đề lẻ tích lũy 6+ năm. Học viên được link Drive đầy đủ hơn so với bản công khai.',
  },
  {
    icon: HiOutlineChatAlt2,
    title: 'Ưu tiên hỏi đáp 1-1 với admin',
    desc: 'Câu hỏi trong khu vực hỏi đáp được admin trả lời sớm hơn cộng đồng. Hỗ trợ qua Zalo riêng tư.',
  },
  {
    icon: HiOutlineUserGroup,
    title: 'Tổng ôn live qua Google Meet',
    desc: 'Buổi tổng ôn hàng tuần về Tiếng Việt, Tiếng Anh, Toán, Logic... Học viên có thể xem lại video sau.',
  },
  {
    icon: HiOutlineSparkles,
    title: 'Tư vấn ngành & du học',
    desc: 'Hỗ trợ chọn ngành, chọn trường, kinh nghiệm xét tuyển ĐHQG-HCM, tư vấn du học (kèm kinh nghiệm Đức).',
  },
  {
    icon: HiOutlineGift,
    title: 'Cập nhật nội dung miễn phí',
    desc: 'Mọi đề thi thử, tài liệu, quiz mới đều được cập nhật liên tục mà không tốn thêm bất kỳ chi phí nào.',
  },
];

const GUARANTEES = [
  { icon: HiOutlineCheckCircle, label: 'Tự động kích hoạt' },
  { icon: HiOutlineRefresh, label: 'Hỗ trợ nếu gặp trục trặc' },
  { icon: HiOutlineStar, label: 'Đánh giá tích cực từ học viên' },
];

const STATUS_META = {
  pending: {
    title: 'Đang chờ thanh toán',
    desc: 'Hệ thống đang đợi giao dịch chuyển khoản khớp số tiền và nội dung.',
    icon: HiOutlineClock,
    className: 'text-amber-600 dark:text-amber-400',
    boxClass: 'bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/40',
  },
  partial: {
    title: 'Thanh toán chưa đủ',
    desc: 'Hệ thống đã nhận giao dịch nhưng số tiền nhỏ hơn mức học phí yêu cầu.',
    icon: HiOutlineExclamationCircle,
    className: 'text-orange-600 dark:text-orange-400',
    boxClass: 'bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-800/40',
  },
  paid_waiting_email: {
    title: 'Đã nhận tiền, đang chờ email Google',
    desc: 'Vui lòng nhập email Google để hệ thống cấp quyền học vào tài khoản đúng.',
    icon: HiOutlineMail,
    className: 'text-cyan-600 dark:text-cyan-400',
    boxClass: 'bg-cyan-50 border-cyan-200 dark:bg-cyan-900/20 dark:border-cyan-800/40',
  },
  paid: {
    title: 'Thanh toán thành công',
    desc: 'Tài khoản của bạn đã được cấp quyền truy cập khóa học.',
    icon: HiOutlineCheckCircle,
    className: 'text-green-600 dark:text-green-400',
    boxClass: 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800/40',
  },
  expired: {
    title: 'Mã thanh toán đã hết hạn',
    desc: 'Bạn có thể tạo lại mã QR mới trong vài giây.',
    icon: HiOutlineExclamationCircle,
    className: 'text-red-600 dark:text-red-400',
    boxClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/40',
  },
  failed: {
    title: 'Có lỗi xác nhận thanh toán',
    desc: 'Vui lòng liên hệ hỗ trợ Zalo để được kiểm tra nhanh.',
    icon: HiOutlineExclamationCircle,
    className: 'text-red-600 dark:text-red-400',
    boxClass: 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800/40',
  },
};

const DEFAULT_BANK_INFO = {
  bank_name: 'TP BANK',
  bank_account_number: '04351047435',
  bank_account_name: 'NGUYEN HUY HOANG',
  expected_amount: 699000,
};

const POLL_INTERVAL_MS = 6000;

function formatVnd(amount) {
  return `${new Intl.NumberFormat('vi-VN').format(amount || 0)}đ`;
}

export default function Register() {
  const { user, refreshUser } = useAuth();

  const [googleEmail, setGoogleEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [order, setOrder] = useState(null);
  const [loadingCreate, setLoadingCreate] = useState(false);
  const [loadingBindEmail, setLoadingBindEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [copiedTransfer, setCopiedTransfer] = useState(false);
  const [isStatusPopupOpen, setIsStatusPopupOpen] = useState(false);
  const [lastPopupKey, setLastPopupKey] = useState('');

  useEffect(() => {
    if (user?.email && !googleEmail) {
      setGoogleEmail(user.email);
    }
    if (user?.name && !fullName) {
      setFullName(user.name);
    }
  }, [user?.email, user?.name, googleEmail, fullName]);

  useEffect(() => {
    if (!order?.order_code) {
      return undefined;
    }

    let isMounted = true;

    const syncStatus = async () => {
      try {
        const response = await getPaymentOrderStatus(order.order_code);
        if (!isMounted) {
          return;
        }

        setOrder(response.data);
        setErrorMessage('');

        if (response.data.status === 'paid') {
          refreshUser?.().catch(() => null);
        }
      } catch (err) {
        if (!isMounted) {
          return;
        }
        setErrorMessage(err.response?.data?.detail || 'Không thể đồng bộ trạng thái thanh toán.');
      }
    };

    syncStatus();

    if (['paid', 'expired', 'failed'].includes(order.status)) {
      return () => {
        isMounted = false;
      };
    }

    const timerId = window.setInterval(syncStatus, POLL_INTERVAL_MS);
    return () => {
      isMounted = false;
      window.clearInterval(timerId);
    };
  }, [order?.order_code, order?.status, refreshUser]);

  useEffect(() => {
    if (!order?.order_code || !order?.status) {
      return;
    }

    const popupKey = `${order.order_code}:${order.status}`;
    if (order.status !== 'pending' && popupKey !== lastPopupKey) {
      setIsStatusPopupOpen(true);
      setLastPopupKey(popupKey);
    }
  }, [order?.order_code, order?.status, lastPopupKey]);

  const handleCreateOrder = async (event) => {
    event.preventDefault();
    setLoadingCreate(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      const payload = {};
      if (googleEmail.trim()) {
        payload.google_email = googleEmail.trim();
      }
      if (fullName.trim()) {
        payload.full_name = fullName.trim();
      }

      const response = await createPaymentOrder(payload);
      setOrder(response.data);
      setInfoMessage('Đã tạo mã thanh toán mới. Vui lòng chuyển khoản đúng nội dung bên dưới để yêu cầu được tự động xác nhận.');

      if (response.data.google_email) {
        setGoogleEmail(response.data.google_email);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Không thể tạo mã thanh toán. Vui lòng thử lại.');
    } finally {
      setLoadingCreate(false);
    }
  };

  const handleBindEmail = async () => {
    if (!order?.order_code) {
      return;
    }
    if (!googleEmail.trim()) {
      setErrorMessage('Vui lòng nhập email Google để cấp quyền học.');
      return;
    }

    setLoadingBindEmail(true);
    setErrorMessage('');
    setInfoMessage('');

    try {
      await bindPaymentOrderEmail(order.order_code, {
        google_email: googleEmail.trim(),
      });

      const refreshed = await getPaymentOrderStatus(order.order_code);
      setOrder(refreshed.data);
      setInfoMessage('Đã cập nhật email Google thành công.');

      if (refreshed.data.status === 'paid') {
        refreshUser?.().catch(() => null);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Không thể cập nhật email cho đơn thanh toán.');
    } finally {
      setLoadingBindEmail(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!order?.order_code) {
      return;
    }
    setErrorMessage('');

    try {
      const response = await getPaymentOrderStatus(order.order_code);
      setOrder(response.data);
      if (response.data.status === 'paid') {
        refreshUser?.().catch(() => null);
      }
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Không thể làm mới trạng thái thanh toán.');
    }
  };

  const handleCopyTransfer = async () => {
    if (!order?.transfer_content) {
      return;
    }

    try {
      await navigator.clipboard.writeText(order.transfer_content);
      setCopiedTransfer(true);
      window.setTimeout(() => setCopiedTransfer(false), 1800);
    } catch {
      setErrorMessage('Không thể sao chép nội dung chuyển khoản. Vui lòng sao chép thủ công.');
    }
  };

  const status = order?.status || 'pending';
  const statusMeta = STATUS_META[status] || STATUS_META.pending;
  const StatusIcon = statusMeta.icon;

  const showPostPaymentLinks = order?.status === 'paid';
  const needsEmail = order?.status === 'paid_waiting_email';
  const bankInfo = {
    ...DEFAULT_BANK_INFO,
    ...(order || {}),
  };
  const supportZaloUrl = order?.support_zalo_url || 'https://zalo.me/0355912940';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Hero */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 dark:from-primary-800 dark:to-indigo-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-xs font-bold text-white/90 mb-4">
            <HiOutlineFire className="h-4 w-4 text-yellow-300" />
            ƯU ĐÃI ĐỢT 2 - 2026
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Đăng ký khóa học ĐGNL
          </h1>
          <p className="text-lg text-white/85 max-w-xl mx-auto">
            Trọn bộ lộ trình ôn ĐGNL chỉ với <strong className="text-yellow-300">699,000đ</strong> —
            truy cập trọn đời, hỗ trợ 1-1, đảm bảo hài lòng.
          </p>

          {/* Quick trust strip */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-white/80">
            {GUARANTEES.map((g, i) => (
              <div key={i} className="inline-flex items-center gap-1.5">
                <g.icon className="h-4 w-4 text-green-300" />
                <span>{g.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* ── Course Benefits Value Stack ─────────────── */}
        <section className="mb-12">
          <div className="text-center mb-8">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold tracking-wide mb-3">
              💎 BẠN SẼ NHẬN ĐƯỢC GÌ?
            </span>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Tất cả quyền lợi gói gọn trong một học phí
            </h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Không có gói "Cơ bản/Premium" phức tạp. Một mức giá duy nhất, đầy đủ tất cả.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {BENEFITS.map((b, i) => (
              <div
                key={i}
                className={`relative flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                  b.highlight
                    ? 'bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 border-primary-200 dark:border-primary-700 shadow-sm'
                    : 'bg-white dark:bg-slate-800 border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700'
                }`}
              >
                {b.highlight && (
                  <span className="absolute -top-2 right-3 px-2 py-0.5 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 text-white text-[10px] font-bold">
                    GIÁ TRỊ CỐT LÕI
                  </span>
                )}
                <div className="flex-shrink-0 w-11 h-11 rounded-xl bg-white dark:bg-slate-700 border border-primary-100 dark:border-primary-800 flex items-center justify-center shadow-sm">
                  <b.icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{b.title}</h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Value vs price */}
          <div className="mt-6 rounded-2xl p-5 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border border-emerald-200 dark:border-emerald-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-2xl">💸</div>
                <div>
                  <p className="text-sm font-bold text-emerald-900 dark:text-emerald-200">
                    So sánh: Học trung tâm offline 8-15 triệu / khóa ĐGNL
                  </p>
                  <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
                    Tại đây bạn nhận tất cả với <strong>699,000đ</strong> — tiết kiệm hơn <strong>90%</strong> mà nội dung không thua kém.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Steps */}
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            3 bước để bắt đầu học
          </h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Toàn bộ quá trình diễn ra trong vòng 2 phút.
          </p>
        </div>

        <div className="space-y-6 mb-12">
          {STEPS.map((s) => (
            <div
              key={s.step}
              className="flex gap-5 bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700"
            >
              <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                <s.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-1">
                  Bước {s.step}
                </p>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {s.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Create payment order */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5 text-center">
            Tạo mã QR chuyển khoản tự động
          </h2>
          <form onSubmit={handleCreateOrder} className="space-y-4 max-w-xl mx-auto">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="google-email">
                Email Google cấp quyền
              </label>
              <input
                id="google-email"
                type="email"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                placeholder="abcd@gmail.com"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                Bạn có thể nhập email trước hoặc sau khi thanh toán. Dùng email có đuôi @gmail vì bạn phải dùng tài khoản Google này để đăng nhập khóa học.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5" htmlFor="full-name">
                Họ và tên
              </label>
              <input
                id="full-name"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Nguyễn Huy Hoàng"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <button
              type="submit"
              disabled={loadingCreate}
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium transition-colors"
            >
              {loadingCreate ? 'Đang tạo mã...' : 'Tạo QR thanh toán'}
            </button>

            {infoMessage && (
              <p className="text-sm text-green-600 dark:text-green-400">{infoMessage}</p>
            )}
            {errorMessage && (
              <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
            )}
          </form>
        </div>

        {order && (
          <div className={`mb-8 rounded-2xl border p-6 ${statusMeta.boxClass}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <StatusIcon className={`h-6 w-6 mt-0.5 ${statusMeta.className}`} />
                <div>
                  <h3 className={`text-base font-semibold ${statusMeta.className}`}>{statusMeta.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{statusMeta.desc}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsStatusPopupOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary-300 dark:border-primary-600 text-xs font-medium text-primary-700 dark:text-primary-300 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors"
                >
                  Xem popup trạng thái
                </button>
                <button
                  type="button"
                  onClick={handleRefreshStatus}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-slate-500 text-xs font-medium text-gray-700 dark:text-gray-200 hover:bg-white/70 dark:hover:bg-slate-700 transition-colors"
                >
                  <HiOutlineRefresh className="h-4 w-4" />
                  Làm mới
                </button>
              </div>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 text-sm">
              <div className="rounded-xl bg-white/70 dark:bg-slate-800/50 border border-white/80 dark:border-slate-700 p-3">
                <p className="text-gray-500 dark:text-gray-400 text-xs">Mã đơn thanh toán</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1 break-all">{order.order_code}</p>
              </div>
              <div className="rounded-xl bg-white/70 dark:bg-slate-800/50 border border-white/80 dark:border-slate-700 p-3">
                <p className="text-gray-500 dark:text-gray-400 text-xs">Số tiền cần chuyển</p>
                <p className="font-semibold text-gray-900 dark:text-white mt-1">{formatVnd(order.expected_amount)}</p>
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-white/80 dark:border-slate-700 p-3">
              <p className="text-gray-500 dark:text-gray-400 text-xs">Nội dung chuyển khoản</p>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white break-all">{order.transfer_content}</p>
                <button
                  type="button"
                  onClick={handleCopyTransfer}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs bg-gray-800 text-white dark:bg-slate-200 dark:text-slate-900 hover:opacity-90"
                >
                  <HiOutlineClipboard className="h-3.5 w-3.5" />
                  {copiedTransfer ? 'Đã sao chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {order.status !== 'paid' && (
              <div className="mt-3 rounded-xl bg-white/70 dark:bg-slate-800/50 border border-white/80 dark:border-slate-700 p-3">
                <p className="text-gray-500 dark:text-gray-400 text-xs">Email Google gắn với đơn</p>
                <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white break-all">
                    {order.google_email || 'Chưa cập nhật email'}
                  </p>
                  <button
                    type="button"
                    onClick={handleBindEmail}
                    disabled={loadingBindEmail}
                    className="px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-xs font-medium"
                  >
                    {loadingBindEmail ? 'Đang cập nhật...' : 'Cập nhật email cho đơn'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Bank Info */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 mb-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 text-center">
            Thông tin chuyển khoản
          </h2>
          <div className="grid gap-8 lg:grid-cols-2 lg:items-start">
            <div className="flex justify-center lg:justify-start">
              {order?.qr_image_url ? (
                <img
                  src={order.qr_image_url}
                  alt={`QR thanh toán ${order.order_code}`}
                  className="w-full max-w-[420px] aspect-square object-contain rounded-2xl border border-gray-200 dark:border-slate-600 bg-white p-4"
                />
              ) : (
                <div className="w-full max-w-[420px] aspect-square rounded-2xl border border-dashed border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 flex items-center justify-center p-6 text-center">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    QR sẽ hiển thị tại đây sau khi bạn tạo mã thanh toán.
                  </p>
                </div>
              )}
            </div>

            <div className="max-w-sm lg:max-w-none mx-auto w-full space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Ngân hàng</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bankInfo.bank_name}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Số tài khoản</span>
                <span className="font-mono font-semibold text-gray-900 dark:text-white">{bankInfo.bank_account_number}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-slate-700">
                <span className="text-sm text-gray-500 dark:text-gray-400">Chủ tài khoản</span>
                <span className="font-semibold text-gray-900 dark:text-white">{bankInfo.bank_account_name}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Học phí</span>
                <div className="text-right">
                  <span className="font-bold text-green-600 dark:text-green-400">{formatVnd(bankInfo.expected_amount)}</span>
                </div>
              </div>
            </div>
          </div>

          {needsEmail && (
            <div className="mt-6 max-w-sm mx-auto">
              <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">
                Hệ thống đã nhận tiền. Nhập email Google để cấp quyền học ngay:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="youremail@gmail.com"
                  className="flex-1 px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  onClick={handleBindEmail}
                  disabled={loadingBindEmail}
                  className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-medium"
                >
                  {loadingBindEmail ? 'Đang cập nhật...' : 'Xác nhận email'}
                </button>
              </div>
            </div>
          )}
        </div>

        {showPostPaymentLinks && (
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-green-200 dark:border-green-800/40 mb-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
              Truy cập khóa học của bạn
            </h3>

            <div className="flex flex-wrap justify-center gap-4">
              {order?.zalo_group_url && (
                <a
                  href={order.zalo_group_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  Vào group Zalo khóa học
                </a>
              )}
              {order?.youtube_guide_url && (
                <a
                  href={order.youtube_guide_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors"
                >
                  Xem video hướng dẫn
                </a>
              )}
            </div>

            {!order?.zalo_group_url && !order?.youtube_guide_url && (
              <p className="text-center text-sm text-amber-700 dark:text-amber-300 mt-2">
                Quản trị viên chưa cấu hình link nhóm học/video hướng dẫn. Vui lòng liên hệ hỗ trợ để nhận link truy cập.
              </p>
            )}
          </div>
        )}

        {/* ── FAQ Section ─────────────────────────────── */}
        <section className="mb-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Các câu hỏi thường gặp
            </h2>
          </div>
          <div className="space-y-3">
            {[
              {
                q: 'Sau khi thanh toán bao lâu thì được học?',
                a: 'Ngay lập tức! SePay sẽ gửi webhook về hệ thống ngay khi bạn chuyển khoản thành công và tài khoản Google của bạn được kích hoạt tự động trong vòng vài giây.',
              },
              {
                q: 'Em đã có tài khoản miễn phí rồi, có cần tạo lại không?',
                a: 'Không cần. Chỉ cần nhập đúng email Google đang dùng vào form đăng ký, hệ thống sẽ tự động nâng cấp quyền truy cập đầy đủ.',
              },
              {
                q: 'Khóa học có thời hạn truy cập không?',
                a: 'Không. Học phí chỉ trả 1 lần, bạn được truy cập trọn đời tất cả nội dung hiện tại và các nội dung sẽ cập nhật trong tương lai.',
              },
              {
                q: 'Em ở tỉnh, có học được không?',
                a: 'Có. Toàn bộ khóa học là online qua website + nhóm Zalo + Google Meet. Bạn chỉ cần điện thoại hoặc máy tính có mạng là học được.',
              },
              {
                q: 'Nếu có vấn đề về thanh toán thì sao?',
                a: 'Liên hệ Zalo hỗ trợ phía dưới hoặc hotline 0355 912 940. Trong trường hợp lỗi từ hệ thống mà không truy cập được, anh sẽ hoàn 100% học phí.',
              },
            ].map((item, i) => (
              <details
                key={i}
                className="group bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden"
              >
                <summary className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 list-none">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white pr-4">
                    {item.q}
                  </span>
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center text-sm font-bold group-open:rotate-45 transition-transform">
                    +
                  </span>
                </summary>
                <div className="px-5 pb-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
        </section>

        {/* Contact */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-8 border border-gray-200 dark:border-slate-700 text-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Liên hệ để được hỗ trợ
          </h3>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href={supportZaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-medium rounded-xl hover:bg-blue-600 transition-colors"
            >
              Zalo hỗ trợ sự cố
            </a>
          </div>
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <HiOutlinePhone className="h-4 w-4" />
            <span>Hotline: 0355 912 940</span>
          </div>
          <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
            Nếu bạn đã thanh toán thành công nhưng chưa truy cập được, hãy gửi ảnh màn hình chuyển khoản qua Zalo để anh hỗ trợ.
          </p>
        </div>

        {/* Back to home */}
        <div className="mt-8 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium transition-colors"
          >
            ← Về trang chủ
          </Link>
        </div>
      </div>

      {isStatusPopupOpen && order && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[1px] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Cập nhật trạng thái thanh toán</h3>
              <button
                type="button"
                onClick={() => setIsStatusPopupOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-slate-700 dark:text-gray-300"
                aria-label="Đóng popup trạng thái"
              >
                <HiX className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className={`rounded-xl border p-4 ${statusMeta.boxClass}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={`h-6 w-6 mt-0.5 ${statusMeta.className}`} />
                  <div>
                    <p className={`font-semibold ${statusMeta.className}`}>{statusMeta.title}</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{statusMeta.desc}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Mã đơn: {order.order_code}</p>
              </div>

              {showPostPaymentLinks && (
                <div className="space-y-2">
                  {order?.zalo_group_url && (
                    <a
                      href={order.zalo_group_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                      Vào group Zalo khóa học
                    </a>
                  )}
                  {order?.youtube_guide_url && (
                    <a
                      href={order.youtube_guide_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 text-white text-sm font-medium rounded-xl hover:bg-rose-700 transition-colors"
                    >
                      Xem video hướng dẫn
                    </a>
                  )}
                  {!order?.zalo_group_url && !order?.youtube_guide_url && (
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Quản trị viên chưa cấu hình link nhóm học hoặc video hướng dẫn.
                    </p>
                  )}
                </div>
              )}

              <a
                href={supportZaloUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
              >
                Zalo hỗ trợ sự cố
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
