/**
 * Landing Page
 * Modern, GitHub Education-inspired landing page for ĐGNL Mỗi Ngày.
 */

import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlinePlay,
  HiOutlineBookOpen,
  HiOutlineLightningBolt,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineChatAlt2,
  HiOutlineClipboardCheck,
  HiOutlineCalendar,
  HiOutlineGlobe,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineStar,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const SUBJECTS = [
  { key: 'tieng_viet', name: 'Tiếng Việt', emoji: '📝' },
  { key: 'tieng_anh', name: 'Tiếng Anh', emoji: '🌍' },
  { key: 'toan', name: 'Toán Phổ Thông', emoji: '📐' },
  { key: 'logic', name: 'Logic & Phân tích số liệu', emoji: '🧠' },
  { key: 'vat_ly', name: 'Vật Lý', emoji: '⚡' },
  { key: 'hoa_hoc', name: 'Hóa Học', emoji: '🧪' },
  { key: 'sinh_hoc', name: 'Sinh Học', emoji: '🧬' },
  { key: 'dia_ly', name: 'Địa Lý', emoji: '🗺️' },
  { key: 'lich_su', name: 'Lịch Sử', emoji: '📜' },
  { key: 'gdktpl', name: 'GDKT & Pháp Luật', emoji: '⚖️' },
];

const BENEFITS = [
  { icon: HiOutlineChatAlt2, title: 'Hỗ trợ trực tiếp', desc: 'Giải đáp câu hỏi và vấn đề liên quan đến ĐGNL' },
  { icon: HiOutlineUserGroup, title: 'Tổng ôn qua Google Meet', desc: 'Ôn kiến thức và kỹ năng làm bài trực tiếp' },
  { icon: HiOutlineDocumentText, title: 'Kho tài liệu đa dạng', desc: 'Tài liệu chuyên đề và nâng cao được tích lũy qua nhiều năm' },
  { icon: HiOutlineLightningBolt, title: 'Tư vấn học tập', desc: 'Hỗ trợ về học tập, du học, chọn ngành' },
  { icon: HiOutlineClipboardCheck, title: 'Đề thi thử hàng tuần', desc: 'Kiểm tra kết quả và theo dõi tiến độ' },
  { icon: HiOutlineGlobe, title: 'Cộng đồng ôn thi', desc: 'Kết nối với các bạn học sinh cùng mục tiêu' },
];

const SCHEDULE = [
  { date: '10.05.2026', topic: 'Tổng ôn Phân tích Số liệu và Tư duy Logic' },
  { date: '17.05.2026', topic: 'Tổng ôn Suy luận Khoa học' },
];

export default function Landing() {
  const { isAuthenticated, login } = useAuth();
  const { theme } = useTheme();

  const handleGoogleSuccess = async (response) => {
    try { await login(response.credential); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen">
      {/* ── Hero Section ─────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-800 dark:from-slate-900 dark:via-primary-950 dark:to-slate-900" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
          <div className="text-center max-w-3xl mx-auto">
            {/* <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-6">
              <HiOutlineStar className="h-4 w-4 text-yellow-300" />
              Khóa học Đánh Giá Năng Lực V-ACT 2026 - Đợt 2 đang mở đăng ký
            </div> */}

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
              <span className="block">Tổng Ôn</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 to-yellow-400">
                Đánh Giá Năng Lực
              </span>{' '}
              2026
            </h1>

            <p className="mt-6 text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
              Tổng ôn toàn diện qua 2 giai đoạn: <strong className="text-white">Nền tảng</strong> và{' '}
              <strong className="text-white">Luyện đề</strong>.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dang-ky"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-primary-700 font-bold rounded-xl hover:bg-gray-50 transition-all shadow-lg shadow-black/10 text-base"
              >
                Đăng ký ngay
                <HiOutlineArrowRight className="h-5 w-5" />
              </Link>
              <Link
                to="/hoc-thu"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-base"
              >
                <HiOutlinePlay className="h-5 w-5" />
                Học thử miễn phí
              </Link>             
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
                  className="fill-gray-50 dark:fill-slate-900" />
          </svg>
        </div>
      </section>

      {/* ── Course Structure ──────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Cấu trúc khóa học
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Khóa học gồm 2 giai đoạn được thiết kế để giúp học sinh ôn tập từ nền tảng đến thực chiến luyện đề.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Phase 1 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-semibold mb-4">
                GIAI ĐOẠN 1
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Nền tảng</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Trang bị kiến thức nền tảng, những dạng bài thường gặp, và phương pháp giải nhanh cho từng môn học.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {SUBJECTS.map((s) => (
                  <div key={s.key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 py-1">
                    <span>{s.emoji}</span>
                    <span>{s.name}</span>
                  </div>
                ))}
              </div>
              <Link
                to="/nen-tang"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Xem chi tiết
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>

            {/* Phase 2 */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs font-semibold mb-4">
                GIAI ĐOẠN 2
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">Luyện đề</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                Luyện tập với kho 100+ đề thi thử chuẩn cấu trúc, quản lý thời gian, kiểm tra lỗ hổng kiến thức. Mỗi đề sẽ đi kèm hướng dẫn giải dễ hiểu và video giải thích chi tiết.
              </p>
              <ul className="space-y-2">
                {['Đề chính thức và minh học ĐHQG-HCM các năm', '100+ đề theo cấu trúc mới 2026', 'Ebook luyện đề bổ trợ'].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <HiOutlineCheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                to="/luyen-de"
                className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
              >
                Xem chi tiết
                <HiOutlineArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-cyan-900/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-3">
                  TỔNG ÔN THEO DẠNG 
                </div>
                <h3 className="text-2xl font-bold mb-2">Luyện tập chuyên sâu theo từng dạng bài</h3>
                <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
                  Làm quiz về Tiếng Việt, Tiếng Anh, Toán và phân tích số liệu,... để phát hiện lỗ hổng trước khi vào đề thực chiến (Học viên khóa học được ưu tiên truy cập trọn bộ tất cả quiz).
                </p>
              </div>
              <Link
                to="/luyen-tap-chuyen-sau"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                Làm quiz miễn phí <HiOutlineArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-900/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-3">
                  HỎI BÀI & XEM LỜI GIẢI
                </div>
                <h3 className="text-2xl font-bold mb-2">Đăng câu hỏi và nhận lời giải từ cộng đồng hỗ trợ</h3>
                <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
                  Đăng câu hỏi và xem lời giải công khai (Học viên khóa học được ưu tiên trả lời từ admin).
                </p>
              </div>
              <Link
                to="/hoi-dap"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                Vào Hỏi đáp <HiOutlineArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <div className="mt-8 rounded-2xl p-6 sm:p-8 bg-gradient-to-r from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-3">
                  TÀI LIỆU ĐGNL MIỄN PHÍ
                </div>
                <h3 className="text-2xl font-bold mb-2">Kho tài liệu mở được tích lũy qua nhiều năm</h3>
                <p className="text-sm text-white/80 max-w-2xl leading-relaxed">
                  Tải sách luyện đề, tài liệu chuyên sâu, mẹo ôn thi (Học viên khóa học được ưu tiên truy cập trọn bộ thư mục Drive đầy đủ hơn).
                </p>
              </div>
              <Link
                to="/kho-tai-lieu-mo"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors flex-shrink-0"
              >
                Vào kho tài liệu <HiOutlineArrowRight className="h-5 w-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Benefits ─────────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Lợi ích khi tham gia
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md transition-all bg-gray-50 dark:bg-slate-900">
                <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <b.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Schedule ─────────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Lịch ôn tập Đợt 2 - 2026
            </h2>
          </div>

          <div className="space-y-4">
            {SCHEDULE.map((s, i) => (
              <div key={i} className="flex items-center gap-4 bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
                <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center">
                  <HiOutlineCalendar className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-primary-600 dark:text-primary-400">{s.date}</p>
                  <p className="text-gray-700 dark:text-gray-300 font-medium">{s.topic}</p>
                </div>
              </div>
            ))}
            <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-4">
              Học viên cũng có thể xem lại các buổi tổng ôn về Tiếng Việt, Tiếng Anh và Toán trước đó.
            </p>
          </div>
        </div>
      </section>

      {/* ── Teacher Info ──────────────────────────── */}
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-slate-800 dark:to-slate-800/50 rounded-2xl p-8 md:p-10 border border-gray-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Thông tin giảng viên
            </h2>
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Hiện tại anh đang theo học chuyên ngành <strong>Applied Artificial Intelligence</strong> tại Đức.
                Anh đã có hơn <strong>6 năm kinh nghiệm</strong> giảng dạy Đánh Giá Năng Lực HCM cho các thế hệ học sinh.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Sau khi có được kết quả tốt trong kỳ thi ĐGNL năm 2021 và đậu vào <strong>Đại học Bách Khoa TP.HCM</strong>,
                anh đã bắt đầu dạy một nhóm nhỏ học sinh và các bạn đã gặt hái được kết quả khá tốt.
              </p>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                Sau đó anh đã lên ý tưởng phát triển một nền tảng ôn luyện ĐGNL toàn diện. Với website này, học viên có thể 
                xem bài giảng, tải tài liệu, luyện đề và xem hướng dẫn chi tiết tại một nơi duy nhất.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing CTA ──────────────────────────── */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Ôn tập và đạt 900+ ĐGNL ngay hôm nay!
          </h2>
          <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-xl mx-auto">
            Tham gia ngay một trong những Khóa học qua website toàn diện nhất tại Hồ Chí Minh.
          </p>

          <div className="inline-flex flex-col items-center bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-lg border border-gray-100 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 line-through mb-1">699,000 VNĐ</p>
            <p className="text-4xl font-extrabold text-gray-900 dark:text-white">
              599,000 <span className="text-lg font-normal text-gray-500 dark:text-gray-400">VNĐ</span>
            </p>
            <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-1 mb-6">
              ⭐ Ưu đãi Đợt 2 - đến hết tháng 4/2026
            </p>
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors shadow-lg shadow-primary-600/20 text-base"
            >
              Đăng ký ngay
              <HiOutlineArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {!isAuthenticated && (
            <div className="mt-8">
              <p className="text-sm text-gray-400 dark:text-gray-500 mb-3">
                Hoặc đăng nhập để xem nội dung học thử miễn phí
              </p>
              <div className="inline-flex">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => {}}
                  shape="pill"
                  text="signin_with"
                  theme={theme === 'dark' ? 'filled_black' : 'outline'}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
