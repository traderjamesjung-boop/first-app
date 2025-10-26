import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { questionApi } from '../services/api';
import toast from 'react-hot-toast';

/**
 * 관리자용 문제 입력 페이지
 * 코딩 없이 웹에서 바로 문제를 입력할 수 있습니다
 */
const AdminQuestionPage = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    categoryName: '',
    examType: 'BAR_EXAM',
    examYear: new Date().getFullYear(),
    questionNumber: 1,
    content: '',
    choice1: '',
    choice2: '',
    choice3: '',
    choice4: '',
    choice5: '',
    correctAnswer: 1,
    explanation: '',
    caseLaw: '',
    keywords: '',
    difficulty: 'MEDIUM',
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      // 선택지 배열 생성
      const choices = [
        { id: 1, text: data.choice1 },
        { id: 2, text: data.choice2 },
        { id: 3, text: data.choice3 },
        { id: 4, text: data.choice4 },
      ];
      if (data.choice5) {
        choices.push({ id: 5, text: data.choice5 });
      }

      // 키워드 배열 생성
      const keywords = data.keywords
        ? data.keywords.split(',').map((k: string) => k.trim())
        : [];

      // API 호출 (카테고리 ID는 서버에서 처리하도록 수정 필요)
      return questionApi.createQuestion({
        categoryName: data.categoryName,
        examType: data.examType,
        examYear: data.examYear,
        questionNumber: data.questionNumber,
        content: data.content,
        choices,
        correctAnswer: data.correctAnswer,
        explanation: data.explanation,
        caseLaw: data.caseLaw || null,
        keywords,
        difficulty: data.difficulty,
      });
    },
    onSuccess: () => {
      toast.success('문제가 성공적으로 추가되었습니다!');
      queryClient.invalidateQueries({ queryKey: ['questions'] });
      // 폼 초기화
      setFormData({
        ...formData,
        content: '',
        choice1: '',
        choice2: '',
        choice3: '',
        choice4: '',
        choice5: '',
        explanation: '',
        caseLaw: '',
        keywords: '',
        questionNumber: formData.questionNumber + 1,
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '문제 추가 실패');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 유효성 검사
    if (!formData.content.trim()) {
      toast.error('문제 내용을 입력해주세요.');
      return;
    }
    if (!formData.choice1.trim() || !formData.choice2.trim() || 
        !formData.choice3.trim() || !formData.choice4.trim()) {
      toast.error('선택지 1~4는 필수입니다.');
      return;
    }
    if (!formData.explanation.trim()) {
      toast.error('해설을 입력해주세요.');
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          문제 추가하기
        </h1>
        <p className="text-gray-600 mb-8">
          아래 양식을 채워서 새로운 문제를 추가하세요
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 유형 *
              </label>
              <select
                required
                value={formData.examType}
                onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="CIVIL_SERVICE">공무원</option>
                <option value="BAR_EXAM">변호사시험</option>
                <option value="JUDICIAL_EXAM">사법시험</option>
                <option value="PRACTICE">연습문제</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                시험 년도 *
              </label>
              <input
                type="number"
                required
                value={formData.examYear}
                onChange={(e) => setFormData({ ...formData, examYear: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                문제 번호 *
              </label>
              <input
                type="number"
                required
                value={formData.questionNumber}
                onChange={(e) => setFormData({ ...formData, questionNumber: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                카테고리 *
              </label>
              <input
                type="text"
                required
                placeholder="예: 형법총론, 형법각론"
                value={formData.categoryName}
                onChange={(e) => setFormData({ ...formData, categoryName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                난이도 *
              </label>
              <select
                required
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="EASY">쉬움</option>
                <option value="MEDIUM">보통</option>
                <option value="HARD">어려움</option>
                <option value="EXPERT">전문가</option>
              </select>
            </div>
          </div>

          {/* 문제 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              문제 내용 *
            </label>
            <textarea
              required
              rows={4}
              placeholder="문제 전체 내용을 입력하세요"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 선택지 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900">선택지</h3>
            
            {[1, 2, 3, 4, 5].map((num) => (
              <div key={num}>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  선택지 {num} {num <= 4 && '*'}
                </label>
                <input
                  type="text"
                  required={num <= 4}
                  placeholder={num === 5 ? '(5지선다인 경우만 입력)' : `${num}번 선택지 내용`}
                  value={formData[`choice${num}` as keyof typeof formData] as string}
                  onChange={(e) => setFormData({ ...formData, [`choice${num}`]: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
            ))}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                정답 번호 *
              </label>
              <select
                required
                value={formData.correctAnswer}
                onChange={(e) => setFormData({ ...formData, correctAnswer: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value={1}>1번</option>
                <option value={2}>2번</option>
                <option value={3}>3번</option>
                <option value={4}>4번</option>
                <option value={5}>5번</option>
              </select>
            </div>
          </div>

          {/* 해설 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              해설 *
            </label>
            <textarea
              required
              rows={6}
              placeholder="문제에 대한 상세한 해설을 입력하세요. 각 선택지에 대한 설명을 포함하면 좋습니다."
              value={formData.explanation}
              onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 추가 정보 */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                관련 판례 (선택사항)
              </label>
              <input
                type="text"
                placeholder="예: 대법원 2008도10479 판결"
                value={formData.caseLaw}
                onChange={(e) => setFormData({ ...formData, caseLaw: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                키워드 (쉼표로 구분)
              </label>
              <input
                type="text"
                placeholder="예: 행위시법,소급효금지,형법총론"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          {/* 제출 버튼 */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <button
              type="button"
              onClick={() => {
                if (confirm('입력한 내용을 모두 지우시겠습니까?')) {
                  setFormData({
                    ...formData,
                    content: '',
                    choice1: '',
                    choice2: '',
                    choice3: '',
                    choice4: '',
                    choice5: '',
                    explanation: '',
                    caseLaw: '',
                    keywords: '',
                  });
                }
              }}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
            >
              {createMutation.isPending ? '추가 중...' : '문제 추가하기'}
            </button>
          </div>
        </form>
      </div>

      {/* 도움말 */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="font-semibold text-blue-900 mb-3">💡 입력 팁</h3>
        <ul className="space-y-2 text-sm text-blue-800">
          <li>• 문제는 명확하고 간결하게 작성하세요</li>
          <li>• 각 선택지는 비슷한 길이로 작성하는 것이 좋습니다</li>
          <li>• 해설에는 정답뿐만 아니라 오답인 이유도 포함하세요</li>
          <li>• 관련 법 조문과 판례를 함께 입력하면 학생들에게 도움이 됩니다</li>
          <li>• 키워드는 검색에 도움이 되므로 정확하게 입력하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminQuestionPage;
