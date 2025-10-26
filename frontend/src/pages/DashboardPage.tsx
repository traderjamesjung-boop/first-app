import { useQuery } from '@tanstack/react-query';
import { studyApi } from '../services/api';
import { TrendingUp, Target, Award, Calendar } from 'lucide-react';

const DashboardPage = () => {
  const { data: stats } = useQuery({
    queryKey: ['statistics'],
    queryFn: () => studyApi.getStatistics(),
  });

  const { data: todayRecord } = useQuery({
    queryKey: ['todayRecord'],
    queryFn: () => studyApi.getTodayRecord(),
  });

  const { data: streak } = useQuery({
    queryKey: ['streak'],
    queryFn: () => studyApi.getStreak(),
  });

  const statistics = stats?.data.data.statistics || {};
  const today = todayRecord?.data.data || {};
  const streakData = streak?.data.data.streak || {};

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">대시보드</h1>
        <p className="text-gray-600 mt-2">학습 현황을 한눈에 확인하세요</p>
      </div>

      {/* 오늘의 학습 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Target className="h-5 w-5 mr-2 text-primary-600" />
          오늘의 학습
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-primary-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">풀이한 문제</p>
            <p className="text-3xl font-bold text-primary-600">
              {today.record?.questionCount || 0} / {today.dailyGoal || 10}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">정답률</p>
            <p className="text-3xl font-bold text-green-600">
              {today.record?.questionCount
                ? Math.round((today.record.correctCount / today.record.questionCount) * 100)
                : 0}%
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-gray-600">학습 진도</p>
            <p className="text-3xl font-bold text-blue-600">{today.progress || 0}%</p>
          </div>
        </div>
      </div>

      {/* 전체 통계 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">총 문제 수</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalAttempts || 0}
              </p>
            </div>
            <TrendingUp className="h-10 w-10 text-primary-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">정답률</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.correctRate?.toFixed(1) || 0}%
              </p>
            </div>
            <Target className="h-10 w-10 text-green-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">연속 학습</p>
              <p className="text-2xl font-bold text-orange-600">
                {streakData.current || 0}일
              </p>
            </div>
            <Calendar className="h-10 w-10 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">고유 문제</p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.uniqueQuestionsSolved || 0}
              </p>
            </div>
            <Award className="h-10 w-10 text-blue-600" />
          </div>
        </div>
      </div>

      {/* 빠른 시작 */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">빠른 시작</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a
            href="/study"
            className="bg-primary-600 text-white rounded-lg p-6 hover:bg-primary-700 transition-colors text-center"
          >
            <p className="text-lg font-semibold">오늘의 문제 풀기</p>
            <p className="text-sm mt-2 opacity-90">일일 학습 목표를 달성하세요</p>
          </a>
          <a
            href="/questions"
            className="bg-gray-100 text-gray-900 rounded-lg p-6 hover:bg-gray-200 transition-colors text-center"
          >
            <p className="text-lg font-semibold">문제 검색</p>
            <p className="text-sm mt-2 text-gray-600">특정 주제의 문제를 찾아보세요</p>
          </a>
          <a
            href="/courses"
            className="bg-gray-100 text-gray-900 rounded-lg p-6 hover:bg-gray-200 transition-colors text-center"
          >
            <p className="text-lg font-semibold">강의 수강</p>
            <p className="text-sm mt-2 text-gray-600">체계적인 학습을 시작하세요</p>
          </a>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
