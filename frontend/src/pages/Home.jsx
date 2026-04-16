/**
 * Home Page
 * Landing page / dashboard for the course.
 */

import { Link } from 'react-router-dom';
import { HiOutlinePlay, HiOutlineBookOpen, HiOutlineClock, HiOutlineTrendingUp } from 'react-icons/hi';

export default function Home() {
  return (
    <div className="max-w-5xl mx-auto px-8 py-10">
      {/* Hero Section */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Chào mừng đến với <span className="text-primary-600">Đánh Giá Năng Lực Mỗi Ngày</span> 🎓
        </h1>
        <p className="text-lg text-gray-500 max-w-2xl">
          Ôn Đánh giá Năng lực 900+. Nền tảng -> Luyện đề -> Thi thử.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
            <HiOutlineBookOpen className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">6</p>
          <p className="text-sm text-gray-500">Bài học</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-green-50 flex items-center justify-center mb-4">
            <HiOutlineClock className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">12h</p>
          <p className="text-sm text-gray-500">Thời lượng</p>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
            <HiOutlineTrendingUp className="h-6 w-6 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">0%</p>
          <p className="text-sm text-gray-500">Tiến độ</p>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8
                      text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-2">Bắt đầu học ngay!</h2>
        <p className="text-primary-100 mb-6 max-w-md">
          Chọn bài học đầu tiên từ sidebar hoặc nhấn nút bên dưới để bắt đầu hành trình.
        </p>
        <Link
          to="/lessons/1"
          className="inline-flex items-center gap-2 px-6 py-3 bg-white text-primary-700
                     font-semibold rounded-xl hover:bg-primary-50 transition-colors shadow-sm"
        >
          <HiOutlinePlay className="h-5 w-5" />
          Bài học đầu tiên
        </Link>
      </div>
    </div>
  );
}
