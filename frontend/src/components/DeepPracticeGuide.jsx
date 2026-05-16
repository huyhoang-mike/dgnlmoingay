import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineBookOpen,
  HiOutlineClipboardCheck,
  HiOutlineLightningBolt,
  HiOutlineStar,
} from 'react-icons/hi';

const STEPS = [
  {
    icon: HiOutlineBookOpen,
    title: 'Chọn đúng phần đang yếu',
    desc: 'Lọc theo Tiếng Việt, Tiếng Anh, Toán hoặc kỹ năng nhỏ để học sinh vào bài nhanh.',
  },
  {
    icon: HiOutlineLightningBolt,
    title: 'Làm nhanh 10-15 phút',
    desc: 'Mỗi quiz ngắn, tập trung vào một dạng bài để tạo thói quen quay lại website mỗi ngày.',
  },
  {
    icon: HiOutlineClipboardCheck,
    title: 'Xem đáp án ngay',
    desc: 'Sau khi nộp bài, hệ thống hiện điểm, câu sai và giải thích để biết cần ôn gì tiếp theo.',
  },
];

export default function DeepPracticeGuide() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5 mb-10">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300 text-xs font-bold mb-4">
          <HiOutlineStar className="h-4 w-4" /> LUYỆN TẬP CHUYÊN SÂU
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Học ít hơn mỗi lần, quay lại nhiều hơn mỗi ngày
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
          Khu vực này được thiết kế như các bài quiz ngắn theo từng mảng kiến thức. Học sinh có thể thử miễn phí một số bài,
          sau đó đăng ký khóa học để mở toàn bộ ngân hàng câu hỏi, bài giảng và đề thực chiến.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-4 border border-gray-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center mb-3">
                <step.icon className="h-5 w-5 text-cyan-700 dark:text-cyan-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{step.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-primary-600 to-indigo-700 text-white shadow-lg shadow-primary-900/10">
        <p className="text-sm font-semibold text-white/80 mb-2">Lộ trình gợi ý</p>
        <h3 className="text-xl font-bold mb-3">Quiz ngắn → Bài giảng → Đề thực chiến</h3>
        <p className="text-sm text-white/80 leading-relaxed mb-5">
          Nếu làm sai nhiều ở một chuyên đề, hãy quay lại phần Nền tảng để học bài giảng rồi thử lại.
        </p>
        <div className="flex flex-col gap-2">
          <Link
            to="/nen-tang"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-bold hover:bg-gray-50 transition-colors"
          >
            Học lại nền tảng <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
          <Link
            to="/thuc-chien"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm font-semibold hover:bg-white/20 transition-colors"
          >
            Làm đề thực chiến <HiOutlineArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
