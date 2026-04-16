/**
 * Platform Page (Nền tảng)
 * Displays all foundation course subjects as a card grid.
 */

import { Link } from 'react-router-dom';
import { HiOutlineArrowRight, HiOutlineLockClosed, HiOutlineBookOpen } from 'react-icons/hi';
import { useAuth } from '../contexts/AuthContext';

const CATEGORIES = [
  {
    group: '1. Sử dụng Ngôn ngữ',
    subjects: [
      { key: 'tieng_viet', name: 'Tiếng Việt', emoji: '📝', desc: 'Ngữ pháp, đọc hiểu, và kỹ năng sử dụng tiếng Việt' },
      { key: 'tieng_anh', name: 'Tiếng Anh', emoji: '🌍', desc: 'Từ vựng, ngữ pháp, và đọc hiểu tiếng Anh' },
    ],
  },
  {
    group: '2. Toán học',
    subjects: [
      { key: 'toan', name: 'Toán Phổ Thông', emoji: '📐', desc: 'Đại số, hình học, giải tích, và xác suất thống kê' },
    ],
  },
  {
    group: '3. Tư duy Khoa học',
    subjects: [
      { key: 'logic', name: 'Logic & Phân tích Số liệu', emoji: '🧠', desc: 'Tư duy logic, phân tích dữ liệu và biểu đồ' },
      { key: 'vat_ly', name: 'Vật Lý', emoji: '⚡', desc: 'Cơ học, điện từ, quang học, và nhiệt học' },
      { key: 'hoa_hoc', name: 'Hóa Học', emoji: '🧪', desc: 'Hóa đại cương, vô cơ, và hữu cơ' },
      { key: 'sinh_hoc', name: 'Sinh Học', emoji: '🧬', desc: 'Tế bào, di truyền, sinh thái, và tiến hóa' },
      { key: 'dia_ly', name: 'Địa Lý', emoji: '🗺️', desc: 'Địa lý tự nhiên và kinh tế xã hội' },
      { key: 'lich_su', name: 'Lịch Sử', emoji: '📜', desc: 'Lịch sử Việt Nam và thế giới' },
      { key: 'gdktpl', name: 'GD Kinh tế & Pháp luật', emoji: '⚖️', desc: 'Kiến thức kinh tế và pháp luật cơ bản' },
    ],
  },
  {
    group: '4. Nâng cao 900+',
    subjects: [
      { key: 'nang_cao', name: 'Tài liệu Nâng cao', emoji: '🚀', desc: 'Tài liệu và Ebook cho mục tiêu 900+ điểm' },
    ],
  },
];

export default function Platform() {
  const { isEnrolled } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-800 dark:to-cyan-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-sm text-white/90 mb-4">
            GIAI ĐOẠN 1
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
            Khóa học Nền tảng 2026
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            Mỗi môn học gồm bài giảng video và tài liệu đi kèm. Đọc tài liệu trước, sau đó xem bài giảng để tiếp thu hiệu quả hơn.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {CATEGORIES.map((cat) => (
          <div key={cat.group} className="mb-10">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <HiOutlineBookOpen className="h-5 w-5 text-primary-600 dark:text-primary-400" />
              {cat.group}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {cat.subjects.map((s) => (
                <Link
                  key={s.key}
                  to={`/nen-tang/${s.key}`}
                  className="group bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700 hover:border-primary-200 dark:hover:border-primary-700 hover:shadow-md transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <span className="text-2xl">{s.emoji}</span>
                    {!isEnrolled && (
                      <HiOutlineLockClosed className="h-4 w-4 text-gray-300 dark:text-slate-600" />
                    )}
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                    {s.name}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{s.desc}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 dark:text-primary-400 group-hover:gap-2 transition-all">
                    Xem bài học <HiOutlineArrowRight className="h-3 w-3" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        ))}

        {!isEnrolled && (
          <div className="mt-8 text-center bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-800/30 rounded-xl p-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
              🔒 Một số nội dung yêu cầu đăng ký khóa học để truy cập đầy đủ.
            </p>
            <Link
              to="/dang-ky"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
            >
              Đăng ký ngay <HiOutlineArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
