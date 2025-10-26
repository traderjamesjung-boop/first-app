import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { questionApi } from '../services/api';
import toast from 'react-hot-toast';

const StudyPage = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [startTime] = useState(Date.now());

  const { data, isLoading } = useQuery({
    queryKey: ['randomQuestions'],
    queryFn: () => questionApi.getRandomQuestions({ count: 10 }),
  });

  const questions = data?.data.data.questions || [];
  const currentQuestion = questions[currentIndex];

  const handleSubmit = async () => {
    if (selectedAnswer === null) {
      toast.error('답을 선택해주세요.');
      return;
    }

    const timeSpent = Math.floor((Date.now() - startTime) / 1000);

    try {
      await questionApi.submitAnswer(currentQuestion.id, {
        selectedAnswer,
        timeSpent,
      });
      setIsSubmitted(true);
    } catch (error) {
      toast.error('답안 제출 실패');
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setIsSubmitted(false);
    } else {
      toast.success('모든 문제를 완료했습니다!');
    }
  };

  if (isLoading) {
    return <div className="text-center py-12">문제를 불러오는 중...</div>;
  }

  if (!currentQuestion) {
    return <div className="text-center py-12">문제가 없습니다.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">
            문제 {currentIndex + 1} / {questions.length}
          </h2>
          <span className="text-gray-600">
            {currentQuestion.examType} {currentQuestion.examYear}년
          </span>
        </div>

        <div className="mb-8">
          <p className="text-lg leading-relaxed whitespace-pre-wrap">
            {currentQuestion.content}
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {(currentQuestion.choices as any[]).map((choice: any) => (
            <label
              key={choice.id}
              className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                selectedAnswer === choice.id
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              } ${isSubmitted ? 'cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="answer"
                value={choice.id}
                checked={selectedAnswer === choice.id}
                onChange={() => !isSubmitted && setSelectedAnswer(choice.id)}
                disabled={isSubmitted}
                className="mr-3"
              />
              <span>{choice.text}</span>
            </label>
          ))}
        </div>

        {isSubmitted && (
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold mb-2">해설</h3>
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentQuestion.explanation}
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-4">
          {!isSubmitted ? (
            <button
              onClick={handleSubmit}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              답안 제출
            </button>
          ) : (
            <button
              onClick={handleNext}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium"
            >
              {currentIndex < questions.length - 1 ? '다음 문제' : '완료'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudyPage;
