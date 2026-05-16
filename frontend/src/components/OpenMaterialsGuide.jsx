import { Link } from 'react-router-dom';
import {
  HiOutlineArrowRight,
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiOutlineFolderOpen,
  HiOutlineShieldCheck,
  HiOutlineStar,
} from 'react-icons/hi';

const GUIDE_ITEMS = [
  {
    icon: HiOutlineFolderOpen,
    title: 'Kho công khai từ Google Drive',
    desc: 'Tài liệu đã duyệt được lưu trên Google Drive để dễ chia sẻ.',
  },
  {
    icon: HiOutlineCloudUpload,
    title: 'Cộng đồng đóng góp',
    desc: 'Người dùng đăng nhập có thể gửi PDF hoặc ảnh.',
  },
  {
    icon: HiOutlineShieldCheck,
    title: 'Duyệt bản quyền trước khi publish',
    desc: 'Admin kiểm tra nguồn và nội dung trước khi đưa vào thư mục Drive/kho tài liệu mở.',
  },
];

export default function OpenMaterialsGuide() {
  return (
    <section className="grid grid-cols-1 lg:grid-cols-[1.35fr_0.65fr] gap-5 mb-10">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold mb-4">
          <HiOutlineStar className="h-4 w-4" /> KHO TÀI LIỆU MỞ
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Cộng đồng trao đổi tài liệu ôn thi ĐGNL
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed mb-5">
          Tài liệu công khai gồm đề cương, bài tập, đề thi thử và tài liệu tổng hợp giúp học sinh ôn tập hiệu quả cho kỳ thi.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {GUIDE_ITEMS.map((item) => (
            <div key={item.title} className="rounded-xl bg-gray-50 dark:bg-slate-900/60 p-4 border border-gray-100 dark:border-slate-700">
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3">
                <item.icon className="h-5 w-5 text-emerald-700 dark:text-emerald-300" />
              </div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white shadow-lg shadow-emerald-900/10">
        <p className="text-sm font-semibold text-white/80 mb-2">Dành cho học viên</p>
        <h3 className="text-xl font-bold mb-3">Quyền lợi tài liệu nâng cao</h3>
        <p className="text-sm text-white/80 leading-relaxed mb-5">
          Học viên được ưu tiên duyệt tài liệu đóng góp và có thể truy cập thư mục Drive gốc với tài liệu được sắp xếp đầy đủ hơn.
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
