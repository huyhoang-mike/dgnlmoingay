/**
 * Landing Page
 * Modern, conversion-oriented landing page for ĐGNL Mỗi Ngày.
 * Inspired by best-practice EdTech landing pages.
 */

import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import {
  HiOutlinePlay,
  HiOutlineLightningBolt,
  HiOutlineUserGroup,
  HiOutlineDocumentText,
  HiOutlineChatAlt2,
  HiOutlineClipboardCheck,
  HiOutlineGlobe,
  HiOutlineArrowRight,
  HiOutlineCheckCircle,
  HiOutlineStar,
  HiOutlineAcademicCap,
  HiOutlineSparkles,
  HiOutlineTrendingUp,
  HiOutlineShieldCheck,
  HiOutlineFire,
} from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';
import JsonLd, { courseSchema, orgSchema } from '../components/JsonLd';
import { useTheme } from '../contexts/ThemeContext';

/* ── Data ─────────────────────────────────── */

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
  { icon: HiOutlineDocumentText, title: 'Kho tài liệu đa dạng', desc: 'Tài liệu chuyên đề và nâng cao tích lũy nhiều năm' },
  { icon: HiOutlineLightningBolt, title: 'Tư vấn học tập', desc: 'Hỗ trợ về học tập, du học, chọn ngành' },
  { icon: HiOutlineClipboardCheck, title: 'Đề thi thử hàng tuần', desc: 'Kiểm tra kết quả và theo dõi tiến độ' },
  { icon: HiOutlineGlobe, title: 'Cộng đồng ôn thi', desc: 'Kết nối với các bạn học sinh cùng mục tiêu' },
];

const STATS = [
  { value: '900+', label: 'Điểm cao nhất của học viên', icon: HiOutlineTrendingUp },
  { value: '6+', label: 'Năm kinh nghiệm giảng dạy', icon: HiOutlineAcademicCap },
  { value: '500+', label: 'Học viên đã đồng hành', icon: HiOutlineUserGroup },
  { value: '100+', label: 'Đề thi thử & tài liệu', icon: HiOutlineDocumentText },
];

const STUDENT_RESULTS = [
  { name: 'Bạn N.M.A', school: 'THPT Lê Hồng Phong', score: '1052', subject: 'ĐGNL HCM 2026', color: 'from-amber-400 to-orange-500' },
  { name: 'Bạn T.H.P', school: 'THPT Nguyễn Thượng Hiền', score: '1018', subject: 'ĐGNL HCM 2026', color: 'from-rose-400 to-pink-500' },
  { name: 'Bạn L.K.D', school: 'THPT Bùi Thị Xuân', score: '987', subject: 'ĐGNL HCM 2026', color: 'from-sky-400 to-blue-500' },
  { name: 'Bạn P.A.T', school: 'THPT Gia Định', score: '965', subject: 'ĐGNL HCM 2026', color: 'from-emerald-400 to-green-500' },
  { name: 'Bạn V.M.H', school: 'THPT Trần Đại Nghĩa', score: '952', subject: 'ĐGNL HCM 2026', color: 'from-violet-400 to-purple-500' },
  { name: 'Bạn N.T.K', school: 'THPT Nguyễn Du', score: '930', subject: 'ĐGNL HCM 2026', color: 'from-cyan-400 to-teal-500' },
];

const TESTIMONIALS = [
  {
    name: 'Minh Anh',
    role: 'Học viên Đợt 1 - 2026',
    avatar: '👩‍🎓',
    rating: 5,
    text: 'Khóa học cực kỳ chi tiết, bài giảng dễ hiểu. Anh hỗ trợ tận tình kể cả lúc khuya. Em từ 700 lên 1052 điểm chỉ sau 3 tháng ôn cùng anh!',
  },
  {
    name: 'Hoàng Phúc',
    role: 'THPT Nguyễn Thượng Hiền',
    avatar: '👨‍🎓',
    rating: 5,
    text: 'Phần luyện đề và quiz theo dạng rất hay. Mỗi câu đều có lời giải video kỹ càng nên em hiểu sâu chứ không học vẹt. Đậu BK rồi anh ơi!',
  },
  {
    name: 'Khánh Duy',
    role: 'THPT Bùi Thị Xuân',
    avatar: '🧑‍🎓',
    rating: 5,
    text: 'Em rất thích phần hỏi đáp. Bài nào khó đăng lên là có người trả lời ngay. Tài liệu cũng nhiều, đầy đủ các môn em yếu.',
  },
  {
    name: 'Anh Thư',
    role: 'THPT Gia Định',
    avatar: '👩‍🎓',
    rating: 5,
    text: 'Lúc đầu em tưởng học online không hiệu quả, nhưng anh dạy có tâm và website tổ chức rất khoa học. 965 điểm cho lần thi đầu tiên!',
  },
  {
    name: 'Minh Hằng',
    role: 'THPT Trần Đại Nghĩa',
    avatar: '👩‍🎓',
    rating: 5,
    text: 'Anh không chỉ dạy kiến thức mà còn dạy chiến thuật làm bài, quản lý thời gian. Đây mới là thứ làm em tăng điểm nhanh nhất.',
  },
  {
    name: 'Tiến Khoa',
    role: 'THPT Nguyễn Du',
    avatar: '👨‍🎓',
    rating: 5,
    text: 'Học phí rẻ mà chất lượng vượt mong đợi. Anh còn tư vấn ngành cho em rất kỹ. Cảm ơn anh nhiều ạ!',
  },
];

const TEACHER_ACHIEVEMENTS = [
  { icon: '🎓', title: 'Cử nhân Đại học Bách Khoa TP.HCM', desc: 'Kỹ Sư Tài Năng Ngành Kỹ Thuật Điều khiển & Tự Động Hóa (Đầu vào bằng ĐGNL)' },
  { icon: '🇩🇪', title: 'Học bổng trao đổi tại Đức', desc: 'Đại học OTH Regensburg' },
  { icon: '💯', title: '10 điểm Tiếng Anh THPTQG', desc: 'Kỳ thi tốt nghiệp THPT' },
  { icon: '🏆', title: 'Học sinh giỏi môn Toán', desc: 'Cấp thành phố TP.HCM' },
  { icon: '⭐', title: '6+ năm giảng dạy ĐGNL', desc: 'Đồng hành cùng hàng nghìn học sinh' },
  { icon: '📈', title: 'Học viên đạt điểm cao 900+', desc: 'Đậu BK, Y Dược, KHTN, Ngoại Thương...' },
];

const TRUST_LOGOS = [
  'Đại học Bách Khoa', 'Y Dược TP.HCM', 'Kinh tế TP.HCM', 'Ngoại Thương',
  'KHTN', 'Sư phạm Kỹ thuật', 'Tài chính - Marketing', 'Công nghệ Thông tin',
];

const SHOW_STUDENT_RESULTS_SECTION = false;
const SHOW_TESTIMONIALS_SECTION = false;
const SHOW_HERO_PREVIEW_CARD = false;

/* ── Helpers ──────────────────────────────── */

function useInView(options = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setInView(true);
        obs.disconnect();
      }
    }, { threshold: 0.15, ...options });
    obs.observe(ref.current);
    return () => obs.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return [ref, inView];
}

function Reveal({ children, delay = 0, className = '' }) {
  const [ref, inView] = useInView();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.7s ease-out ${delay}ms, transform 0.7s ease-out ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

/* ── Main Component ───────────────────────── */

export default function Landing() {
  const { isAuthenticated, login } = useAuth();
  const { theme } = useTheme();

  const handleGoogleSuccess = async (response) => {
    try { await login(response.credential); } catch (e) { console.error(e); }
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Structured data for SEO (Course + Organization) */}
      <JsonLd id="ld-course" data={courseSchema()} />
      <JsonLd id="ld-org" data={orgSchema()} />

      {/* ═══════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-600 via-primary-700 to-indigo-900 dark:from-slate-900 dark:via-primary-950 dark:to-slate-900" />

        {/* Animated blobs */}
        <div className="absolute -top-32 -left-20 w-96 h-96 rounded-full bg-cyan-400/30 dark:bg-cyan-500/20 blur-3xl animate-blob" />
        <div className="absolute top-20 -right-20 w-96 h-96 rounded-full bg-fuchsia-400/30 dark:bg-fuchsia-500/20 blur-3xl animate-blob animation-delay-2000" />
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 rounded-full bg-yellow-300/20 dark:bg-yellow-400/10 blur-3xl animate-blob animation-delay-4000" />

        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVHJhbnNmb3JtPSJyb3RhdGUoNDUpIj48cmVjdCB3aWR0aD0iMSIgaGVpZ2h0PSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCBmaWxsPSJ1cmwoI2EpIiB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIi8+PC9zdmc+')] opacity-50" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left: copy */}
            <div className="lg:col-span-7 text-center lg:text-left animate-fade-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 animate-pulse-ring" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-400" />
                </span>
                Đang mở đăng ký khóa ĐGNL V-ACT 2026 - Đợt 2
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.05] tracking-tight">
                Tổng Ôn{' '}
                <span className="relative inline-block">
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-yellow-200 via-yellow-300 to-orange-300">
                    Đánh Giá Năng Lực
                  </span>
                  <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 300 12" fill="none">
                    <path d="M2 9 Q 75 2 150 6 T 298 5" stroke="url(#g1)" strokeWidth="3" strokeLinecap="round" fill="none" />
                    <defs>
                      <linearGradient id="g1" x1="0" x2="1">
                        <stop offset="0" stopColor="#fde047" />
                        <stop offset="1" stopColor="#fb923c" />
                      </linearGradient>
                    </defs>
                  </svg>
                </span>{' '}
                2026
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                Lộ trình toàn diện qua 2 giai đoạn:{' '}
                <strong className="text-white">Nền tảng</strong> &{' '}
                <strong className="text-white">Luyện đề</strong>. Hơn{' '}
                <strong className="text-white">1000 học viên</strong> đã đồng hành và đạt kết quả vượt mong đợi.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row items-center lg:items-start justify-center lg:justify-start gap-4">
                <Link
                  to="/dang-ky"
                  className="group relative w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-gray-900 font-bold rounded-xl hover:from-yellow-300 hover:to-orange-300 transition-all shadow-xl shadow-orange-900/30 text-base overflow-hidden hover:scale-[1.03]"
                >
                  <span className="absolute inset-0 w-1/3 -skew-x-12 bg-white/40 animate-shine pointer-events-none" />
                  <HiOutlineFire className="h-5 w-5" />
                  Đăng ký ngay
                  <HiOutlineArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link
                  to="/hoc-thu"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 backdrop-blur-sm text-white font-semibold rounded-xl border border-white/20 hover:bg-white/20 transition-all text-base"
                >
                  <HiOutlinePlay className="h-5 w-5" />
                  Học thử miễn phí
                </Link>
              </div>

              {/* Mini trust line */}
              <div className="mt-8 flex flex-wrap items-center gap-4 justify-center lg:justify-start text-sm text-white/70">
                <div className="flex items-center gap-1.5">
                  <div className="flex -space-x-2">
                    {['👨‍🎓', '👩‍🎓', '🧑‍🎓', '👩‍💻'].map((e, i) => (
                      <div key={i} className="w-7 h-7 rounded-full bg-white/20 border-2 border-white/30 flex items-center justify-center text-xs">
                        {e}
                      </div>
                    ))}
                  </div>
                  <span>500+ học viên</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <HiOutlineStar key={i} className="h-4 w-4 text-yellow-300 fill-yellow-300" />
                  ))}
                </div>
              </div>
            </div>

            {/* Right: floating preview card */}
            <div className="lg:col-span-5 relative animate-fade-up animation-delay-200">
              <div className="relative max-w-md mx-auto">
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-300/40 via-orange-300/40 to-pink-300/40 rounded-3xl blur-2xl" />

                {SHOW_HERO_PREVIEW_CARD && (
                <div>
                  <div className="relative bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/30">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-indigo-600 flex items-center justify-center text-white text-lg font-bold">📊</div>
                        <div>
                          <div className="text-sm font-bold text-gray-900 dark:text-white">Kết quả ĐGNL 2026</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Học viên khóa ĐGNL năm 2026</div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-bold">LIVE</span>
                    </div>

                    <div className="space-y-3">
                      {[
                        { label: 'Bạn N.M.A', score: 1052, w: '98%', clr: 'from-amber-400 to-orange-500' },
                        { label: 'Bạn T.H.P', score: 1018, w: '94%', clr: 'from-rose-400 to-pink-500' },
                        { label: 'Bạn L.K.D', score: 987,  w: '90%', clr: 'from-sky-400 to-blue-500' },
                        { label: 'Bạn P.A.T', score: 965,  w: '88%', clr: 'from-emerald-400 to-green-500' },
                      ].map((r, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-medium text-gray-700 dark:text-gray-300">{r.label}</span>
                            <span className="font-bold text-gray-900 dark:text-white">{r.score}</span>
                          </div>
                          <div className="h-2 rounded-full bg-gray-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full bg-gradient-to-r ${r.clr} rounded-full transition-all duration-1000`}
                              style={{ width: r.w }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-5 p-3 rounded-xl bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 border border-primary-100 dark:border-primary-800">
                      <div className="flex items-center gap-2 text-xs text-primary-700 dark:text-primary-300">
                        <HiOutlineSparkles className="h-4 w-4" />
                        <span className="font-semibold">Học viên trung bình tăng +180 điểm sau khóa học</span>
                      </div>
                    </div>
                  </div>

                  {/* Floating badge 1 */}
                  <div className="absolute -top-4 -left-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-3 border border-gray-100 dark:border-slate-700 animate-float-slow">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                        <HiOutlineCheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                  </div>

                  {/* Floating badge 2 */}
                  <div className="absolute -bottom-4 -right-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-3 border border-gray-100 dark:border-slate-700 animate-float-slower">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-full bg-yellow-100 dark:bg-yellow-900/40 flex items-center justify-center text-lg">🏆</div>
                      <div>
                        <div className="text-xs font-bold text-gray-900 dark:text-white">Top 1% ĐGNL</div>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">2026</div>
                      </div>
                    </div>
                  </div>
                </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 80" fill="none" className="w-full">
            <path d="M0,40 C360,80 720,0 1080,40 C1260,60 1380,50 1440,40 L1440,80 L0,80 Z"
                  className="fill-gray-50 dark:fill-slate-900" />
          </svg>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TRUST BAR / STATS
      ═══════════════════════════════════════════ */}
      <section className="py-12 bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s, i) => (
              <Reveal key={i} delay={i * 100}>
                <div className="text-center group">
                  <div className="inline-flex w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/40 dark:to-indigo-900/40 items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <s.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600 dark:from-primary-400 dark:to-indigo-400">
                    {s.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{s.label}</div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Marquee of universities */}
          <div className="mt-12 relative overflow-hidden">
            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-4">
              Học viên đã đậu vào các trường top đầu
            </p>
            <div className="relative">
              <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-gray-50 dark:from-slate-900 to-transparent z-10" />
              <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-gray-50 dark:from-slate-900 to-transparent z-10" />
              <div className="flex animate-marquee w-max">
                {[...TRUST_LOGOS, ...TRUST_LOGOS].map((logo, i) => (
                  <div
                    key={i}
                    className="mx-3 px-5 py-2.5 rounded-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-300 whitespace-nowrap shadow-sm"
                  >
                    🎓 {logo}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          COURSE STRUCTURE
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold tracking-wide mb-3">
              LỘ TRÌNH HỌC TẬP
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Cấu trúc khóa học
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Khóa học gồm 2 giai đoạn được thiết kế để giúp học sinh ôn tập từ nền tảng đến thực chiến luyện đề.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Phase 1 */}
            <Reveal delay={100}>
              <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-bold shadow-lg">
                  GIAI ĐOẠN 1
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 mt-2">Nền tảng</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
                  Trang bị kiến thức nền tảng, những dạng bài thường gặp, và phương pháp giải nhanh cho từng môn học.
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SUBJECTS.map((s) => (
                    <div key={s.key} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 py-1 px-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                      <span>{s.emoji}</span>
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
                <Link
                  to="/nen-tang"
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group/link"
                >
                  Xem chi tiết
                  <HiOutlineArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>

            {/* Phase 2 */}
            <Reveal delay={200}>
              <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full">
                <div className="absolute -top-3 left-8 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold shadow-lg">
                  GIAI ĐOẠN 2
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 mt-2">Luyện đề</h3>
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
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors group/link"
                >
                  Xem chi tiết
                  <HiOutlineArrowRight className="h-4 w-4 group-hover/link:translate-x-1 transition-transform" />
                </Link>
              </div>
            </Reveal>
          </div>

          {/* Feature CTAs */}
          {[
            {
              tag: 'TỔNG ÔN THEO DẠNG',
              title: 'Luyện tập chuyên sâu theo từng dạng bài',
              desc: 'Làm quiz về Tiếng Việt, Tiếng Anh, Toán và phân tích số liệu,... để phát hiện lỗ hổng trước khi vào đề thực chiến (Học viên khóa học được ưu tiên truy cập trọn bộ tất cả quiz).',
              link: '/luyen-tap-chuyen-sau',
              btn: 'Làm quiz miễn phí',
              gradient: 'from-cyan-600 to-blue-700',
              shadow: 'shadow-cyan-900/10',
            },
            {
              tag: 'HỎI BÀI & XEM LỜI GIẢI',
              title: 'Đăng câu hỏi và nhận lời giải từ cộng đồng hỗ trợ',
              desc: 'Đăng câu hỏi và xem lời giải công khai (Học viên khóa học được ưu tiên trả lời từ admin).',
              link: '/hoi-dap',
              btn: 'Hỏi đáp ngay',
              gradient: 'from-violet-600 to-indigo-700',
              shadow: 'shadow-violet-900/10',
            },
            {
              tag: 'TÀI LIỆU ĐGNL MIỄN PHÍ',
              title: 'Kho tài liệu mở được tích lũy qua nhiều năm',
              desc: 'Tải sách luyện đề, tài liệu chuyên sâu, mẹo ôn thi (Học viên khóa học được ưu tiên truy cập trọn bộ thư mục Drive đầy đủ hơn).',
              link: '/kho-tai-lieu-mo',
              btn: 'Kho tài liệu',
              gradient: 'from-emerald-600 to-teal-700',
              shadow: 'shadow-emerald-900/10',
            },
          ].map((cta, i) => (
            <Reveal key={i} delay={50}>
              <div className={`mt-8 rounded-2xl p-6 sm:p-8 bg-gradient-to-r ${cta.gradient} text-white shadow-lg ${cta.shadow} hover:shadow-2xl hover:scale-[1.01] transition-all`}>
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-bold mb-3">
                      {cta.tag}
                    </div>
                    <h3 className="text-2xl font-bold mb-2">{cta.title}</h3>
                    <p className="text-sm text-white/80 max-w-2xl leading-relaxed">{cta.desc}</p>
                  </div>
                  <Link
                    to={cta.link}
                    className="group inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white text-primary-700 font-bold hover:bg-gray-50 transition-colors flex-shrink-0"
                  >
                    {cta.btn}
                    <HiOutlineArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          STUDENT RESULTS
      ═══════════════════════════════════════════ */}
      {SHOW_STUDENT_RESULTS_SECTION && (
      <section className="py-20 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute top-20 right-0 w-72 h-72 bg-yellow-200/30 dark:bg-yellow-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-72 h-72 bg-pink-200/30 dark:bg-pink-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 text-xs font-bold tracking-wide mb-3">
              🏆 KẾT QUẢ HỌC VIÊN
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Bảng vinh danh học viên
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Nhiều học viên đã đạt mức điểm{' '}
              <strong className="text-primary-600 dark:text-primary-400">900+</strong> và đậu vào các trường đại học top đầu.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {STUDENT_RESULTS.map((r, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group relative bg-white dark:bg-slate-800 rounded-2xl p-6 border border-gray-100 dark:border-slate-700 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden">
                  <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${r.color} opacity-20 group-hover:opacity-30 group-hover:scale-110 transition-all duration-500`} />
                  <div className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-gray-900 dark:text-white">{r.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{r.school}</p>
                      </div>
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${r.color} flex items-center justify-center text-white text-xl shadow-lg`}>
                        🎯
                      </div>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className={`text-5xl font-extrabold bg-clip-text text-transparent bg-gradient-to-br ${r.color}`}>
                        {r.score}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">điểm</div>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 flex items-center gap-1">
                      <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                      {r.subject}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300} className="mt-10 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              * Tên học viên đã được rút gọn để bảo vệ thông tin cá nhân.
            </p>
          </Reveal>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════
          TEACHER (image + achievements)
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-10 items-center">
            {/* Left: image */}
            <Reveal className="lg:col-span-5">
              <div className="relative max-w-sm mx-auto">
                <div className="absolute -top-6 -left-6 w-24 h-24 bg-yellow-300/60 dark:bg-yellow-500/30 rounded-2xl rotate-12 animate-float-slow" />
                <div className="absolute -bottom-6 -right-6 w-28 h-28 bg-primary-300/60 dark:bg-primary-500/30 rounded-full animate-float-slower" />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white dark:border-slate-700 bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900 dark:to-indigo-900 aspect-[3/4]">
                  <img
                    src="/teacher.jpg"
                    alt="Giảng viên ĐGNL Mỗi Ngày"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fb = e.currentTarget.nextElementSibling;
                      if (fb) fb.style.display = 'flex';
                    }}
                  />
                  {/* Fallback if image missing */}
                  <div className="absolute inset-0 hidden items-center justify-center text-8xl bg-gradient-to-br from-primary-200 to-indigo-200 dark:from-primary-800 dark:to-indigo-800">
                    👨‍🏫
                  </div>
                </div>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-2xl shadow-xl px-4 py-3 border border-gray-100 dark:border-slate-700 flex items-center gap-3 whitespace-nowrap animate-float-slow">
                </div>
              </div>
            </Reveal>

            {/* Right: bio + achievements */}
            <div className="lg:col-span-7">
              <Reveal delay={150}>
                <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-xs font-bold tracking-wide mb-3">
                  👨‍🏫 GIẢNG VIÊN
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                  Người đồng hành cùng bạn{' '}
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                    chinh phục ĐGNL
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-4">
                  Anh là <strong>cử nhân Đại học Bách Khoa TP.HCM</strong>, hiện đang theo học chương trình{' '}
                  <strong>Applied Artificial Intelligence tại Đức</strong> với học bổng toàn phần.
                  Với hơn <strong>6 năm kinh nghiệm</strong> giảng dạy ĐGNL HCM, anh đã đồng hành cùng{' '}
                  hàng nghìn học sinh đạt mức điểm 900+ và đậu vào các trường top đầu.
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-8">
                  Anh xây dựng nền tảng <strong>ĐGNL Mỗi Ngày</strong> với mục tiêu giúp học sinh có thể{' '}
                  <em>xem bài giảng, tải tài liệu, luyện đề và xem hướng dẫn chi tiết tại một nơi duy nhất</em>{' '}
                  - tiện lợi, hiệu quả và tiết kiệm chi phí.
                </p>
              </Reveal>

              <div className="grid sm:grid-cols-2 gap-3">
                {TEACHER_ACHIEVEMENTS.map((a, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <div className="group flex items-start gap-3 p-4 rounded-xl bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all">
                      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/40 dark:to-indigo-900/40 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                        {a.icon}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-gray-900 dark:text-white">{a.title}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{a.desc}</div>
                      </div>
                    </div>
                  </Reveal>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          TESTIMONIALS
      ═══════════════════════════════════════════ */}
      {SHOW_TESTIMONIALS_SECTION && (
      <section className="py-20 bg-white dark:bg-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-pink-100 dark:bg-pink-900/40 text-pink-700 dark:text-pink-300 text-xs font-bold tracking-wide mb-3">
              💬 PHẢN HỒI HỌC VIÊN
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Học viên nói gì về khóa học?
            </h2>
            <p className="mt-3 text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Chia sẻ từ các bạn học viên đã đồng hành cùng khóa ĐGNL Mỗi Ngày.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group h-full p-6 rounded-2xl bg-gradient-to-br from-gray-50 to-white dark:from-slate-800 dark:to-slate-900 border border-gray-100 dark:border-slate-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col">
                  <div className="flex gap-0.5 mb-3">
                    {[...Array(t.rating)].map((_, j) => (
                      <HiOutlineStar key={j} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-sm flex-1 italic relative">
                    <span className="text-4xl text-primary-200 dark:text-primary-800 absolute -top-3 -left-1 font-serif leading-none">"</span>
                    <span className="relative">{t.text}</span>
                  </p>
                  <div className="flex items-center gap-3 mt-5 pt-5 border-t border-gray-100 dark:border-slate-700">
                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-primary-100 to-indigo-100 dark:from-primary-900/40 dark:to-indigo-900/40 flex items-center justify-center text-2xl">
                      {t.avatar}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{t.role}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={300} className="mt-10 text-center">
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
            >
              Tham gia khóa học ngay hôm nay
              <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </Reveal>
        </div>
      </section>
      )}

      {/* ═══════════════════════════════════════════
          BENEFITS
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-gray-50 dark:bg-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal className="text-center mb-14">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold tracking-wide mb-3">
              ✨ QUYỀN LỢI HỌC VIÊN
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
              Lợi ích khi tham gia
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className="group h-full p-6 rounded-2xl border border-gray-100 dark:border-slate-800 hover:border-primary-200 dark:hover:border-primary-800 hover:shadow-md hover:-translate-y-1 transition-all bg-white dark:bg-slate-800">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:rotate-6 transition-transform">
                    <b.icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-2">{b.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{b.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════
          PRICING CTA
      ═══════════════════════════════════════════ */}
      <section className="py-20 bg-white dark:bg-slate-950 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-indigo-50 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-300/20 dark:bg-primary-500/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-300/20 dark:bg-indigo-500/10 rounded-full blur-3xl animate-blob animation-delay-2000" />

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-block px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300 text-xs font-bold tracking-wide mb-4">
              🔥 BẮT ĐẦU NGAY
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-gray-900 dark:text-white mb-4">
              Ôn tập và đạt{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-pink-500 to-violet-600">
                900+ ĐGNL
              </span>{' '}
              ngay hôm nay!
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 max-w-xl mx-auto">
              Tham gia ngay một trong những khóa học qua website toàn diện nhất tại Hồ Chí Minh.
            </p>
          </Reveal>

          <Reveal delay={200}>
            <div className="inline-flex flex-col items-center bg-white dark:bg-slate-800 rounded-3xl p-8 shadow-2xl shadow-primary-900/10 border border-gray-100 dark:border-slate-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300/30 rounded-full blur-2xl" />

              <div className="relative">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Học phí trọn khóa</p>
                <p className="text-5xl sm:text-6xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-indigo-600">
                  699,000
                  <span className="text-xl font-normal text-gray-500 dark:text-gray-400 ml-1">VNĐ</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 mb-6">
                  Truy cập trọn đời • Hỗ trợ 1-1 • Tài liệu cập nhật liên tục
                </p>

                <Link
                  to="/dang-ky"
                  className="group relative inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-primary-600 to-indigo-600 text-white font-bold rounded-xl hover:from-primary-700 hover:to-indigo-700 transition-all shadow-xl shadow-primary-600/30 text-base hover:scale-[1.03] overflow-hidden"
                >
                  <span className="absolute inset-0 w-1/3 -skew-x-12 bg-white/30 animate-shine pointer-events-none" />
                  Đăng ký ngay
                  <HiOutlineArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Link>

                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-500 dark:text-gray-400">
                  <span className="flex items-center gap-1"><HiOutlineShieldCheck className="h-4 w-4 text-green-500" /> Đăng ký một lần</span>
                  <span className="flex items-center gap-1"><HiOutlineCheckCircle className="h-4 w-4 text-green-500" /> Học ngay lập tức</span>
                </div>
              </div>
            </div>
          </Reveal>

          {!isAuthenticated && (
            <Reveal delay={400} className="mt-10">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
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
            </Reveal>
          )}
        </div>
      </section>
    </div>
  );
}
