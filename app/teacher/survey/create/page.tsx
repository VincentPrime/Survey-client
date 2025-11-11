// app/(teacher)/surveys/create/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { surveyService, questionService } from '@/lib/surveyService';
import { Question, QuestionType } from '@/types';

export default function CreateSurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Survey details - REMOVED targeting fields
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'closed',
    due_date: '',
  });

  // Questions
  const [questions, setQuestions] = useState<Partial<Question>[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<Partial<Question>>({
    question_text: '',
    question_type: 'mcq',
    is_required: true,
    options: [''],
    order: 0,
  });

  const questionTypes: { value: QuestionType; label: string }[] = [
    { value: 'mcq', label: 'Multiple Choice' },
    { value: 'likert', label: 'Likert Scale' },
    { value: 'short_answer', label: 'Short Answer' },
    { value: 'long_answer', label: 'Long Answer' },
  ];

  const handleAddQuestion = () => {
    if (!currentQuestion.question_text) {
      alert('Please enter a question');
      return;
    }

    setQuestions([...questions, { ...currentQuestion, order: questions.length }]);
    setCurrentQuestion({
      question_text: '',
      question_type: 'mcq',
      is_required: true,
      options: [''],
      order: questions.length + 1,
    });
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleAddOption = () => {
    setCurrentQuestion({
      ...currentQuestion,
      options: [...(currentQuestion.options || []), ''],
    });
  };

  const handleOptionChange = (index: number, value: string) => {
    const newOptions = [...(currentQuestion.options || [])];
    newOptions[index] = value;
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleRemoveOption = (index: number) => {
    const newOptions = (currentQuestion.options || []).filter((_, i) => i !== index);
    setCurrentQuestion({ ...currentQuestion, options: newOptions });
  };

  const handleSubmit = async () => {
    if (!surveyData.title) {
      alert('Please enter a survey title');
      return;
    }

    if (questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    setLoading(true);
    try {
      // Create survey (will automatically be available to all students when active)
      const survey = await surveyService.createSurvey(surveyData);

      // Create questions
      for (const question of questions) {
        await questionService.createQuestion({
          ...question,
          survey: survey.id,
        } as Question);
      }

      alert('Survey created successfully! It will be visible to all students once activated.');
      router.push('/teacher/dashboard');
    } catch (error) {
      console.error('Failed to create survey:', error);
      alert('Failed to create survey');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Create New Survey</h1>
            <button
              onClick={() => router.back()}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Survey Details</span>
            </div>
            <div className="w-16 h-1 bg-gray-300"></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Add Questions</span>
            </div>
          </div>
        </div>

        {/* Step 1: Survey Details */}
        {step === 1 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Survey Information</h2>
            
            {/* Info Banner */}
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Note:</strong> Once you set this survey to "Active", it will automatically be available to all registered students.
              </p>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Title *
                </label>
                <input
                  type="text"
                  value={surveyData.title}
                  onChange={(e) => setSurveyData({ ...surveyData, title: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Enter survey title"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={surveyData.description}
                  onChange={(e) => setSurveyData({ ...surveyData, description: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder="Describe your survey"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={surveyData.status}
                    onChange={(e) => setSurveyData({ ...surveyData, status: e.target.value as any })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  >
                    <option value="draft">Draft (Not visible to students)</option>
                    <option value="active">Active (Visible to all students)</option>
                    <option value="closed">Closed (No longer accepting responses)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Due Date (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    value={surveyData.due_date}
                    onChange={(e) => setSurveyData({ ...surveyData, due_date: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-end">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next: Add Questions →
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Add Questions */}
        {step === 2 && (
          <div className="space-y-6">
            {/* Added Questions List */}
            {questions.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Questions ({questions.length})
                </h3>
                <div className="space-y-3">
                  {questions.map((q, index) => (
                    <div key={index} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                          <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                            {questionTypes.find(t => t.value === q.question_type)?.label}
                          </span>
                          {q.is_required && (
                            <span className="text-xs text-red-600">Required</span>
                          )}
                        </div>
                        <p className="text-gray-900">{q.question_text}</p>
                        {(q.question_type === 'mcq' || q.question_type === 'likert') && q.options && (
                          <div className="mt-2 text-sm text-gray-600">
                            Options: {q.options.filter(o => o).join(', ')}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => handleRemoveQuestion(index)}
                        className="ml-4 text-red-600 hover:text-red-700"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add New Question Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Add Question</h3>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Question Text *
                  </label>
                  <textarea
                    value={currentQuestion.question_text}
                    onChange={(e) => setCurrentQuestion({ ...currentQuestion, question_text: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    placeholder="Enter your question"
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Question Type
                    </label>
                    <select
                      value={currentQuestion.question_type}
                      onChange={(e) => setCurrentQuestion({ 
                        ...currentQuestion, 
                        question_type: e.target.value as QuestionType,
                        options: e.target.value === 'mcq' || e.target.value === 'likert' ? [''] : []
                      })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    >
                      {questionTypes.map(type => (
                        <option key={type.value} value={type.value}>
                          {type.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentQuestion.is_required}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, is_required: e.target.checked })}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Required Question</span>
                    </label>
                  </div>
                </div>

                {/* MCQ Options */}
                {currentQuestion.question_type === 'mcq' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Options
                    </label>
                    <div className="space-y-2">
                      {(currentQuestion.options || []).map((option, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <input
                            type="text"
                            value={option}
                            onChange={(e) => handleOptionChange(index, e.target.value)}
                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                            placeholder={`Option ${index + 1}`}
                          />
                          {(currentQuestion.options?.length || 0) > 1 && (
                            <button
                              onClick={() => handleRemoveOption(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      ))}
                      <button
                        onClick={handleAddOption}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                      >
                        + Add Option
                      </button>
                    </div>
                  </div>
                )}

                {/* Likert Scale */}
                {currentQuestion.question_type === 'likert' && (
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Value
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.likert_min || 1}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, likert_min: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Value
                      </label>
                      <input
                        type="number"
                        value={currentQuestion.likert_max || 5}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, likert_max: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Min Label
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.likert_min_label || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, likert_min_label: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="e.g., Strongly Disagree"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Max Label
                      </label>
                      <input
                        type="text"
                        value={currentQuestion.likert_max_label || ''}
                        onChange={(e) => setCurrentQuestion({ ...currentQuestion, likert_max_label: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                        placeholder="e.g., Strongly Agree"
                      />
                    </div>
                  </div>
                )}

                <button
                  onClick={handleAddQuestion}
                  className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-blue-500 hover:text-blue-600 font-medium transition-colors"
                >
                  + Add This Question
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                onClick={handleSubmit}
                disabled={loading || questions.length === 0}
                className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Survey'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}