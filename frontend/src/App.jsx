import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Register from './pages/Register';
import Platform from './pages/Platform';
import Practice from './pages/Practice';
import RealPractice from './pages/RealPractice';
import ExamPage from './pages/ExamPage';
import FreeTrial from './pages/FreeTrial';
import SubjectLessons from './pages/SubjectLessons';
import LessonView from './pages/LessonView';
import AdminPanel from './pages/AdminPanel';

const BASE_URL = 'https://dgnlmoingay.com';

const DEFAULT_META = {
  title: 'ĐGNL Mỗi Ngày | Ôn thi Đánh giá năng lực TP.HCM',
  description:
    'Nền tảng ĐGNL Mỗi Ngày giúp ôn thi Đánh giá năng lực TP.HCM với bài giảng video, đề thi thử, chấm điểm chi tiết và lộ trình học rõ ràng.',
  robots: 'index, follow, max-image-preview:large',
};

const ROUTE_META = [
  {
    test: /^\/$/,
    title: 'ĐGNL Mỗi Ngày | Ôn thi Đánh giá năng lực TP.HCM',
    description:
      'Ôn thi Đánh giá năng lực TP.HCM với bài giảng, đề thi thử thực chiến và hệ thống theo dõi tiến độ học tập.',
  },
  {
    test: /^\/dang-ky(?:\/)?$/,
    title: 'Đăng Ký Khóa Học ĐGNL | ĐGNL Mỗi Ngày',
    description:
      'Xem thông tin học phí, quyền lợi và cách đăng ký khóa học ĐGNL tại ĐGNL Mỗi Ngày.',
  },
  {
    test: /^\/hoc-thu(?:\/)?$/,
    title: 'Học Thử Miễn Phí | ĐGNL Mỗi Ngày',
    description:
      'Trải nghiệm bài giảng và nội dung học thử miễn phí trước khi đăng ký khóa ôn thi ĐGNL.',
  },
  {
    test: /^\/nen-tang(?:\/.*)?$/,
    title: 'Nền Tảng Kiến Thức ĐGNL | ĐGNL Mỗi Ngày',
    description:
      'Hệ thống bài giảng nền tảng theo môn giúp xây chắc kiến thức cho kỳ thi Đánh giá năng lực TP.HCM.',
  },
  {
    test: /^\/luyen-de(?:\/.*)?$/,
    title: 'Luyện Đề ĐGNL Theo Môn | ĐGNL Mỗi Ngày',
    description:
      'Luyện đề theo chuyên đề và môn học, có đáp án và phân tích để tối ưu điểm thi ĐGNL.',
  },
  {
    test: /^\/thuc-chien(?:\/)?$/,
    title: 'Đề Thi Thử Thực Chiến ĐGNL | ĐGNL Mỗi Ngày',
    description:
      'Làm đề thi thử thực chiến theo cấu trúc ĐGNL TP.HCM, chấm điểm tự động và xem đáp án chi tiết.',
  },
  {
    test: /^\/thuc-chien\/[^/]+(?:\/)?$/,
    title: 'Thi Thử ĐGNL Trực Tuyến | ĐGNL Mỗi Ngày',
    description:
      'Làm bài thi thử trực tuyến với đồng hồ đếm giờ, kết quả tức thì và phân tích đáp án từng câu.',
  },
  {
    test: /^\/lessons\/\d+(?:\/)?$/,
    title: 'Bài Giảng Chi Tiết | ĐGNL Mỗi Ngày',
    description:
      'Xem video bài giảng, tài liệu PDF và nội dung học tập chi tiết trong lộ trình ôn thi ĐGNL.',
  },
  {
    test: /^\/admin(?:\/)?$/,
    title: 'Quản Trị Học Viên | ĐGNL Mỗi Ngày',
    description: 'Khu vực quản trị học viên và phân quyền truy cập nội dung.',
    robots: 'noindex, nofollow',
  },
];

function upsertMeta({ attr, key, content }) {
  let node = document.querySelector(`meta[${attr}="${key}"]`);
  if (!node) {
    node = document.createElement('meta');
    node.setAttribute(attr, key);
    document.head.appendChild(node);
  }
  node.setAttribute('content', content);
}

function RouteSeoMeta() {
  const { pathname } = useLocation();

  useEffect(() => {
    const current = ROUTE_META.find((item) => item.test.test(pathname)) ?? DEFAULT_META;
    const title = current.title ?? DEFAULT_META.title;
    const description = current.description ?? DEFAULT_META.description;
    const robots = current.robots ?? DEFAULT_META.robots;
    const canonicalPath = pathname.endsWith('/') && pathname !== '/' ? pathname.slice(0, -1) : pathname;
    const canonicalUrl = `${BASE_URL}${canonicalPath || '/'}`;

    document.title = title;

    upsertMeta({ attr: 'name', key: 'description', content: description });
    upsertMeta({ attr: 'name', key: 'robots', content: robots });
    upsertMeta({ attr: 'name', key: 'twitter:title', content: title });
    upsertMeta({ attr: 'name', key: 'twitter:description', content: description });

    upsertMeta({ attr: 'property', key: 'og:title', content: title });
    upsertMeta({ attr: 'property', key: 'og:description', content: description });
    upsertMeta({ attr: 'property', key: 'og:url', content: canonicalUrl });

    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', canonicalUrl);
  }, [pathname]);

  return null;
}

function App() {
  return (
    <>
      <RouteSeoMeta />
      <Routes>
        <Route element={<Layout />}>
          {/* Public Pages */}
          <Route path="/" element={<Landing />} />
          <Route path="/dang-ky" element={<Register />} />
          <Route path="/hoc-thu" element={<FreeTrial />} />
          <Route path="/thuc-chien" element={<RealPractice />} />

          {/* Platform - Nền tảng */}
          <Route path="/nen-tang" element={<Platform />} />
          <Route path="/nen-tang/:subject" element={<SubjectLessons category="nentang" />} />

          {/* Practice - Luyện đề */}
          <Route path="/luyen-de" element={<Practice />} />
          <Route path="/luyen-de/:subject" element={<SubjectLessons category="luyende" />} />

          {/* Lesson View */}
          <Route path="/lessons/:lessonId" element={<LessonView />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>

        {/* Exam page - outside Layout (no Navbar/Footer for focus mode) */}
        <Route path="/thuc-chien/:examId" element={<ExamPage />} />
      </Routes>
    </>
  );
}

export default App;
