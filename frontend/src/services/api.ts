import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터: 토큰 자동 추가
api.interceptors.request.use(
  (config) => {
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      const { state } = JSON.parse(authStorage);
      if (state.token) {
        config.headers.Authorization = `Bearer ${state.token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터: 에러 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (data: any) => api.post('/auth/login', data),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken: string) => api.post('/auth/refresh', { refreshToken }),
};

// User API
export const userApi = {
  getMyProfile: () => api.get('/users/me'),
  updateMyProfile: (data: any) => api.put('/users/me', data),
  getStudySettings: () => api.get('/users/me/study-settings'),
  updateStudySettings: (data: any) => api.put('/users/me/study-settings', data),
};

// Question API
export const questionApi = {
  getQuestions: (params?: any) => api.get('/questions', { params }),
  getQuestionById: (id: string) => api.get(`/questions/${id}`),
  getRandomQuestions: (params?: any) => api.get('/questions/random/daily', { params }),
  getCategories: () => api.get('/questions/categories/list'),
  submitAnswer: (id: string, data: any) => api.post(`/questions/${id}/submit`, data),
  toggleBookmark: (id: string, data?: any) => api.post(`/questions/${id}/bookmark`, data),
  getMyBookmarks: (params?: any) => api.get('/questions/bookmarks/my', { params }),
};

// Study API
export const studyApi = {
  getStatistics: () => api.get('/study/statistics'),
  getStudyRecords: (params?: any) => api.get('/study/records', { params }),
  getTodayRecord: () => api.get('/study/records/today'),
  getWeaknesses: () => api.get('/study/weaknesses'),
  getProgress: () => api.get('/study/progress'),
  getStreak: () => api.get('/study/streak'),
};

// Course API
export const courseApi = {
  getCourses: (params?: any) => api.get('/courses', { params }),
  getCourseById: (id: string) => api.get(`/courses/${id}`),
  enrollCourse: (id: string) => api.post(`/courses/${id}/enroll`),
  getMyEnrollments: () => api.get('/courses/enrollments/my'),
  getCourseProgress: (id: string) => api.get(`/courses/${id}/progress`),
  completeLesson: (courseId: string, lessonId: string) =>
    api.post(`/courses/${courseId}/lessons/${lessonId}/complete`),
  updateLessonProgress: (courseId: string, lessonId: string, data: any) =>
    api.put(`/courses/${courseId}/lessons/${lessonId}/progress`, data),
};

// Ebook API
export const ebookApi = {
  getEbooks: (params?: any) => api.get('/ebooks', { params }),
  getEbookById: (id: string) => api.get(`/ebooks/${id}`),
  purchaseEbook: (id: string) => api.post(`/ebooks/${id}/purchase`),
  getMyEbooks: () => api.get('/ebooks/purchases/my'),
  getDownloadLink: (id: string) => api.get(`/ebooks/${id}/download`),
};

// Payment API
export const paymentApi = {
  requestPayment: (data: any) => api.post('/payments/request', data),
  approvePayment: (data: any) => api.post('/payments/approve', data),
  cancelPayment: (id: string, data: any) => api.post(`/payments/${id}/cancel`, data),
  getMyPayments: () => api.get('/payments/my'),
  getPaymentById: (id: string) => api.get(`/payments/${id}`),
};
