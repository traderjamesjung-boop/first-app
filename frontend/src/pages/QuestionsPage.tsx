import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../services/api';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';

const QuestionsPage = () => {
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    keyword: '',
    examType: '',
    difficulty: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['questions', page, filters],
    queryFn: () => questionApi.getQuestions({ page, limit: 10, ...filters }),
  });

  const questions = data?.data.data.questions || [];
  const pagination = data?.data.data.pagination || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">문제 목록</h1>
        <p className="text-gray-600 mt-2">원하는 문제를 검색하고 풀어보세요</p>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="키워드 검색..."
                value={filters.keyword}
                onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <select
            value={filters.examType}
            onChange={(e) => setFilters({ ...filters, examType: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">시험 유형</option>
            <option value="CIVIL_SERVICE">공무원</option>
            <option value="BAR_EXAM">변호사시험</option>
            <option value="JUDICIAL_EXAM">사법시험</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          >
            <option value="">난이도</option>
            <option value="EASY">쉬움</option>
            <option value="MEDIUM">보통</option>
            <option value="HARD">어려움</option>
            <option value="EXPERT">전문가</option>
          </select>
        </div>
      </div>

      {/* 문제 리스트 */}
      {isLoading ? (
        <div className="text-center py-12">로딩 중...</div>
      ) : (
        <div className="space-y-4">
          {questions.map((question: any) => (
            <Link
              key={question.id}
              to={`/questions/${question.id}`}
              className="block bg-white rounded-lg shadow hover:shadow-md transition-shadow p-6"
            >
              <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-lg">
                  {question.examType} {question.examYear}년 {question.questionNumber}번
                </h3>
                <span className="text-sm text-gray-500">{question.category.name}</span>
              </div>
              <p className="text-gray-700 line-clamp-2">{question.content}</p>
              <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
                <span>난이도: {question.difficulty}</span>
                <span>조회수: {question.viewCount}</span>
                {question.correctRate && (
                  <span>정답률: {question.correctRate.toFixed(1)}%</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* 페이지네이션 */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-4 py-2 rounded ${
                p === page
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsPage;
