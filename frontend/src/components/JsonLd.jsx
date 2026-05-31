/**
 * JsonLd — inject Schema.org structured data for SEO.
 * Renders <script type="application/ld+json"> directly in the React tree.
 * Multiple instances are allowed; Google merges them.
 *
 * Usage:
 *   <JsonLd data={{ "@context": "https://schema.org", "@type": "Course", ... }} />
 *   <JsonLd data={[obj1, obj2]} />
 */

import { useEffect } from 'react';

export default function JsonLd({ data, id }) {
  useEffect(() => {
    if (!data) return undefined;
    const scriptId = id || `ld-${Math.random().toString(36).slice(2, 10)}`;
    const existing = document.getElementById(scriptId);
    if (existing) existing.remove();

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = scriptId;
    try {
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn('JsonLd serialization failed:', err);
    }

    return () => {
      const node = document.getElementById(scriptId);
      if (node) node.remove();
    };
  }, [data, id]);

  return null;
}

// ── Reusable schema builders ────────────────────────────────
const SITE_URL = (typeof window !== 'undefined' && window.location?.origin)
  ? window.location.origin
  : 'https://dgnlmoingay.com';

export const orgSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'EducationalOrganization',
  name: 'ĐGNL Mỗi Ngày',
  alternateName: 'DGNL Moi Ngay',
  url: SITE_URL,
  logo: `${SITE_URL}/logo.png`,
  description:
    'Nền tảng luyện thi Đánh giá năng lực (ĐGNL) ĐHQG HCM trực tuyến — bài giảng video, đề thi thử, ngân hàng Q&A và kho tài liệu miễn phí.',
  sameAs: [
    'https://www.facebook.com/dgnlmoingay',
    'https://www.youtube.com/@dgnlmoingay',
  ],
});

export const courseSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Course',
  name: 'Khóa luyện thi ĐGNL ĐHQG HCM 2026',
  description:
    'Khóa luyện thi Đánh giá năng lực ĐHQG TP.HCM toàn diện: 100+ bài giảng video, 20+ đề thi thử có lời giải, ngân hàng câu hỏi và Q&A 1-1 với giáo viên.',
  provider: orgSchema(),
  educationalLevel: 'High School',
  inLanguage: 'vi',
  url: `${SITE_URL}/dang-ky`,
  hasCourseInstance: {
    '@type': 'CourseInstance',
    courseMode: 'online',
    courseWorkload: 'PT80H',
  },
  offers: {
    '@type': 'Offer',
    price: '599000',
    priceCurrency: 'VND',
    availability: 'https://schema.org/InStock',
    url: `${SITE_URL}/dang-ky`,
  },
});

export const breadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url?.startsWith('http') ? item.url : `${SITE_URL}${item.url || ''}`,
  })),
});

export const qaPageSchema = ({ question, answers = [] }) => {
  if (!question) return null;
  const acceptedAnswer = answers.find((a) => a.is_accepted) || answers[0];
  return {
    '@context': 'https://schema.org',
    '@type': 'QAPage',
    mainEntity: {
      '@type': 'Question',
      name: question.title,
      text: question.body || question.title,
      dateCreated: question.created_at,
      author: question.user?.name
        ? { '@type': 'Person', name: question.user.name }
        : undefined,
      answerCount: answers.length,
      ...(acceptedAnswer && {
        acceptedAnswer: {
          '@type': 'Answer',
          text: acceptedAnswer.body,
          dateCreated: acceptedAnswer.created_at,
          upvoteCount: acceptedAnswer.upvotes || 0,
          author: acceptedAnswer.user?.name
            ? { '@type': 'Person', name: acceptedAnswer.user.name }
            : undefined,
        },
      }),
      suggestedAnswer: answers
        .filter((a) => a !== acceptedAnswer)
        .slice(0, 5)
        .map((a) => ({
          '@type': 'Answer',
          text: a.body,
          dateCreated: a.created_at,
          upvoteCount: a.upvotes || 0,
          author: a.user?.name ? { '@type': 'Person', name: a.user.name } : undefined,
        })),
    },
  };
};

export const learningResourceSchema = (material) => ({
  '@context': 'https://schema.org',
  '@type': 'LearningResource',
  name: material.title,
  description: material.description || material.title,
  url: `${SITE_URL}/kho-tai-lieu-mo#material-${material.id}`,
  learningResourceType: material.category || 'Document',
  educationalLevel: 'High School',
  inLanguage: 'vi',
  about: material.subject || 'Đánh giá năng lực',
  keywords: Array.isArray(material.tags) ? material.tags.join(', ') : undefined,
  dateModified: material.updated_at || material.created_at,
  isAccessibleForFree: true,
  provider: { '@type': 'Organization', name: 'ĐGNL Mỗi Ngày' },
});

export const quizSchema = (quiz) => ({
  '@context': 'https://schema.org',
  '@type': 'Quiz',
  name: quiz.title || quiz.name,
  description: quiz.description || `Luyện tập ${quiz.title || quiz.name} cho kỳ thi ĐGNL.`,
  educationalLevel: 'High School',
  inLanguage: 'vi',
  about: quiz.subject || 'Đánh giá năng lực',
  url: quiz.slug ? `${SITE_URL}/luyen-tap-chuyen-sau/${quiz.slug}` : undefined,
});
