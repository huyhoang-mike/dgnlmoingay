import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ── Request interceptor: attach JWT token ────
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dgnl-token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ─────────
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired — clear and let AuthContext handle it
      localStorage.removeItem('dgnl-token');
    }
    return Promise.reject(error);
  }
);

// ── Auth ─────────────────────────────────────
export const googleLogin = (credential) =>
  client.post('/auth/google', { credential });

export const getMe = (token) =>
  client.get('/auth/me', {
    headers: { Authorization: `Bearer ${token}` },
  });

// ── Lessons ──────────────────────────────────
export const getLessons = (params = {}) => client.get('/lessons/', { params });
export const getLesson = (id) => client.get(`/lessons/${id}`);
export const createLesson = (data) => client.post('/lessons/', data);
export const updateLesson = (id, data) => client.put(`/lessons/${id}`, data);
export const deleteLesson = (id) => client.delete(`/lessons/${id}`);
export const importLessons = (file, mode = 'skip') => {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(`/lessons/import?mode=${mode}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

// ── User Progress ────────────────────────────
export const getUserProgress = (userId) => client.get(`/progress/user/${userId}`);
export const getLessonProgress = (userId, lessonId) =>
  client.get(`/progress/user/${userId}/lesson/${lessonId}`);
export const createProgress = (data) => client.post('/progress/', data);
export const updateProgress = (userId, lessonId, data) =>
  client.put(`/progress/user/${userId}/lesson/${lessonId}`, data);
export const upsertLessonProgress = async (userId, lessonId, data) => {
  try {
    return await updateProgress(userId, lessonId, data);
  } catch (error) {
    if (error.response?.status === 404) {
      return createProgress({
        user_id: userId,
        lesson_id: lessonId,
        ...data,
      });
    }
    throw error;
  }
};

// ── Admin ────────────────────────────────────
export const listUsers = () => client.get('/auth/users');
export const createUser = (data) => client.post('/auth/users', data);
export const updateUser = (userId, data) => client.patch(`/auth/users/${userId}`, data);
export const deleteUser = (userId) => client.delete(`/auth/users/${userId}`);
export const enrollUser = (userId) => client.put(`/auth/users/${userId}/enroll`);
export const unenrollUser = (userId) => client.put(`/auth/users/${userId}/unenroll`);
export const toggleAdmin = (userId) => client.put(`/auth/users/${userId}/toggle-admin`);

// ── Exam Settings ────────────────────────────
export const getExamSettings = () => client.get('/exams/settings');
export const updateExamSetting = (examId, data) => client.put(`/exams/settings/${examId}`, data);

// ── Exam Attempts (enrolled students) ───────
export const submitExamAttempt = (data) => client.post('/exams/attempts', data);
export const listMyExamAttempts = (examId) =>
  client.get('/exams/attempts/me', { params: examId ? { exam_id: examId } : {} });
export const getExamAttempt = (attemptId) => client.get(`/exams/attempts/${attemptId}`);
export const listUserExamAttempts = (userId) =>
  client.get(`/exams/attempts/user/${userId}`);

// ── Payments (SePay) ───────────────────────
export const createPaymentOrder = (data) => client.post('/payments/orders', data);
export const getPaymentOrderStatus = (orderCode) =>
  client.get(`/payments/orders/${orderCode}`);
export const bindPaymentOrderEmail = (orderCode, data) =>
  client.patch(`/payments/orders/${orderCode}/email`, data);

export default client;
