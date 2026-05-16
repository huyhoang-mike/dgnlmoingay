import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineCamera,
  HiOutlineChatAlt2,
  HiOutlineLightningBolt,
  HiOutlineShieldCheck,
} from 'react-icons/hi';

const GUIDE_ITEMS = [
  {
    icon: HiOutlineChatAlt2,
    title: 'Hỏi đúng trọng tâm',
    desc: 'Ghi rõ đề bài, phần chưa hiểu và cách bạn đã thử giải để nhận câu trả lời nhanh hơn.',
  },
  {
    icon: HiOutlineCamera,
    title: 'Đính kèm ảnh đề bài',
    desc: 'Có thể upload ảnh chụp câu hỏi, biểu đồ hoặc lời giải nháp. Ảnh được lưu trên VPS để tải nhanh.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Chọn phạm vi phù hợp',
    desc: 'Học viên có thể hỏi công khai hoặc chỉ trong khóa học; câu hỏi học viên được ưu tiên trả lời.',
  },
];

export default function QAGuide() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5 mb-10">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-300 text-xs font-bold mb-4">
          <HiOutlineLightningBolt className="h-4 w-4" /> CỘNG ĐỒNG HỎI ĐÁP
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Biến câu hỏi của học sinh thành nội dung SEO hữu ích
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
          Những câu hỏi công khai giúp học sinh mới tìm thấy website qua Google. Khi thấy lời giải chất lượng,
          các bạn có thêm lý do đăng ký khóa học để được ưu tiên hỗ trợ.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {GUIDE_ITEMS.map((item) => (
            <div key={item.title} className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-4 border border-gray-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-lg bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3">
                <item.icon className="h-5 w-5 text-violet-700 dark:text-violet-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-violet-600 to-indigo-700 text-white shadow-lg shadow-violet-900/10">
        <p className="text-sm font-semibold text-white/80 mb-2">Dành cho học viên</p>
        <h3 className="text-xl font-bold mb-3">Câu hỏi ưu tiên trong khóa học</h3>
        <p className="text-sm text-white/80 leading-relaxed mb-5">
          Học viên được chọn hỏi riêng trong khóa học và câu hỏi sẽ nổi bật hơn trong hàng chờ trả lời của admin.
        </p>
        <Link
          to="/dang-ky"
          className="inline-flex w-full items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-primary-700 text-sm font-bold hover:bg-gray-50 transition-colors"
        >
          Xem quyền lợi khóa học <HiOutlineArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}
