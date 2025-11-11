// app/(student)/surveys/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { surveyService, responseService } from '@/lib/surveyService';
import { Survey, Question } from '@/types';

export default function TakeSurveyPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = parseInt(params.id as string);

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const questionsPerPage = 5;

  useEffect(() => {
    loadSurvey();
  }, [surveyId]);

  const loadSurvey = async () => {
    try {
      // Check if already submitted
      const { has_submitted } = await surveyService.checkSubmission(surveyId);
      if (has_submitted) {
        alert('You have already submitted this survey');
        router.push('/student/dashboard');
        return;
      }

      const surveyData = await surveyService.getSurvey(surveyId);
      setSurvey(surveyData);
    } catch (error) {
      console.error('Failed to load survey:', error);
      alert('Failed to load survey');
      router.push('/student/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers({ ...answers, [questionId]: value });
  };

  const validateCurrentPage = () => {
    if (!survey?.questions) return true;

    const start = currentPage * questionsPerPage;
    const end = Math.min(start + questionsPerPage, survey.questions.length);
    const pageQuestions = survey.questions.slice(start, end);

    for (const question of pageQuestions) {
      if (question.is_required && !answers[question.id]) {
        alert(`Please answer: ${question.question_text}`);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (!validateCurrentPage()) return;
    setCurrentPage(currentPage + 1);
    window.scrollTo(0, 0);
  };

  const handlePrevious = () => {
    setCurrentPage(currentPage - 1);
    window.scrollTo(0, 0);
  };

  const handleSubmit = async () => {
    if (!validateCurrentPage()) return;
    if (!survey) return;

    // Check all required questions
    for (const question of survey.questions || []) {
      if (question.is_required && !answers[question.id]) {
        alert(`Please answer all required questions`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => {
        const question = survey.questions?.find(q => q.id === parseInt(questionId));
        
        if (question?.question_type === 'mcq') {
          return { question_id: parseInt(questionId), answer_choice: answer };
        } else if (question?.question_type === 'likert') {
          return { question_id: parseInt(questionId), answer_number: answer };
        } else {
          return { question_id: parseInt(questionId), answer_text: answer };
        }
      });

      await responseService.submitResponse({
        survey: surveyId,
        answers: formattedAnswers,
      });

      alert('Survey submitted successfully!');
      router.push('/student/dashboard');
    } catch (error) {
      console.error('Failed to submit survey:', error);
      alert('Failed to submit survey');
    } finally {
      setSubmitting(false);
    }
  };

  const renderQuestion = (question: Question) => {
    switch (question.question_type) {
      case 'mcq':
        return (
          <div className="space-y-3">
            {question.options?.map((option, index) => (
              <label key={index} className="flex items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                <input
                  type="radio"
                  name={`question-${question.id}`}
                  value={option}
                  checked={answers[question.id] === option}
                  onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                  className="w-4 h-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                />
                <span className="ml-3 text-gray-900">{option}</span>
              </label>
            ))}
          </div>
        );

      case 'likert':
        const min = question.likert_min || 1;
        const max = question.likert_max || 5;
        const values = Array.from({ length: max - min + 1 }, (_, i) => min + i);

        return (
          <div className="space-y-4">
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.likert_min_label || 'Min'}</span>
              <span>{question.likert_max_label || 'Max'}</span>
            </div>
            <div className="flex justify-between space-x-2">
              {values.map((value) => (
                <label key={value} className="flex-1 flex flex-col items-center cursor-pointer">
                  <input
                    type="radio"
                    name={`question-${question.id}`}
                    value={value}
                    checked={answers[question.id] === value}
                    onChange={(e) => handleAnswerChange(question.id, parseInt(e.target.value))}
                    className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="mt-2 text-sm font-medium text-gray-700">{value}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'short_answer':
        return (
          <input
            type="text"
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Enter your answer"
          />
        );

      case 'long_answer':
        return (
          <textarea
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            rows={5}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            placeholder="Enter your detailed answer"
          />
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  const questions = survey.questions || [];
  const totalPages = Math.ceil(questions.length / questionsPerPage);
  const start = currentPage * questionsPerPage;
  const end = Math.min(start + questionsPerPage, questions.length);
  const pageQuestions = questions.slice(start, end);
  const progress = ((Object.keys(answers).length / questions.length) * 100).toFixed(0);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{survey.title}</h1>
              <p className="text-sm text-gray-600">{survey.description}</p>
            </div>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span>Progress</span>
              <span>{progress}% Complete</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>
      </header>

      {/* Questions */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="space-y-8">
            {pageQuestions.map((question, index) => (
              <div key={question.id} className="pb-8 border-b border-gray-200 last:border-0 last:pb-0">
                <div className="flex items-start mb-4">
                  <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold text-sm">
                    {start + index + 1}
                  </span>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {question.question_text}
                      {question.is_required && <span className="text-red-600 ml-1">*</span>}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {question.question_type === 'mcq' && 'Select one option'}
                      {question.question_type === 'likert' && 'Rate on the scale'}
                      {question.question_type === 'short_answer' && 'Short text answer'}
                      {question.question_type === 'long_answer' && 'Detailed text answer'}
                    </p>
                  </div>
                </div>
                <div className="ml-12">
                  {renderQuestion(question)}
                </div>
              </div>
            ))}
          </div>

          {/* Navigation */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage + 1} of {totalPages}
              </div>
              <div className="flex space-x-3">
                {currentPage > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    ← Previous
                  </button>
                )}
                {currentPage < totalPages - 1 ? (
                  <button
                    onClick={handleNext}
                    className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Next →
                  </button>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="px-8 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Submitting...' : 'Submit Survey'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Info Card */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="ml-3 text-sm text-blue-800">
              <p className="font-medium">Remember:</p>
              <ul className="mt-1 list-disc list-inside">
                <li>Fields marked with * are required</li>
                <li>You can navigate between pages to review your answers</li>
                <li>Once submitted, you cannot change your responses</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}