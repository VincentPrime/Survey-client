// app/(teacher)/surveys/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { surveyService, questionService } from '@/lib/surveyService';
import { Question, QuestionType } from '@/types';

interface StudentFilters {
  sections: string[];
  courses: string[];
  year_levels: number[];
}

export default function CreateSurveyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  // Student filters from backend
  const [filters, setFilters] = useState<StudentFilters>({
    sections: [],
    courses: [],
    year_levels: []
  });
  const [loadingFilters, setLoadingFilters] = useState(true);
  
  // Survey details with targeting
  const [surveyData, setSurveyData] = useState({
    title: '',
    description: '',
    status: 'draft' as 'draft' | 'active' | 'closed',
    due_date: '',
    target_sections: [] as string[],
    target_courses: [] as string[],
    target_years: [] as number[],
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

  // Fetch student filters on mount
  useEffect(() => {
    fetchStudentFilters();
  }, []);

  const fetchStudentFilters = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('http://localhost:8000/api/users/student_filters/', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setFilters(data);
      }
    } catch (error) {
      console.error('Failed to fetch student filters:', error);
    } finally {
      setLoadingFilters(false);
    }
  };

  // Toggle selection handlers
  const toggleSection = (section: string) => {
    setSurveyData(prev => ({
      ...prev,
      target_sections: prev.target_sections.includes(section)
        ? prev.target_sections.filter(s => s !== section)
        : [...prev.target_sections, section]
    }));
  };

  const toggleCourse = (course: string) => {
    setSurveyData(prev => ({
      ...prev,
      target_courses: prev.target_courses.includes(course)
        ? prev.target_courses.filter(c => c !== course)
        : [...prev.target_courses, course]
    }));
  };

  const toggleYear = (year: number) => {
    setSurveyData(prev => ({
      ...prev,
      target_years: prev.target_years.includes(year)
        ? prev.target_years.filter(y => y !== year)
        : [...prev.target_years, year]
    }));
  };

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
      // Create survey with targeting
      const survey = await surveyService.createSurvey(surveyData);

      // Create questions
      for (const question of questions) {
        await questionService.createQuestion({
          ...question,
          survey: survey.id,
        } as Question);
      }

      alert('Survey created successfully!');
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
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="closed">Closed</option>
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

              {/* Target Audience Section */}
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Target Audience</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Select which students should see this survey. Leave all unselected to show to all students.
                </p>

                {loadingFilters ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-sm text-gray-600">Loading student data...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Sections */}
                    {filters.sections.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Sections ({surveyData.target_sections.length} selected)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {filters.sections.map((section) => (
                            <button
                              key={section}
                              type="button"
                              onClick={() => toggleSection(section)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                surveyData.target_sections.includes(section)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              Section {section}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Courses */}
                    {filters.courses.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Courses ({surveyData.target_courses.length} selected)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {filters.courses.map((course) => (
                            <button
                              key={course}
                              type="button"
                              onClick={() => toggleCourse(course)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                surveyData.target_courses.includes(course)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {course}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Year Levels */}
                    {filters.year_levels.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                          Year Levels ({surveyData.target_years.length} selected)
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {filters.year_levels.map((year) => (
                            <button
                              key={year}
                              type="button"
                              onClick={() => toggleYear(year)}
                              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                                surveyData.target_years.includes(year)
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                            >
                              {year}
                              {year === 1 ? 'st' : year === 2 ? 'nd' : year === 3 ? 'rd' : 'th'} Year
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Summary */}
                    {(surveyData.target_sections.length > 0 || 
                      surveyData.target_courses.length > 0 || 
                      surveyData.target_years.length > 0) && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          <strong>This survey will be visible to:</strong> Students in{' '}
                          {surveyData.target_sections.length > 0 && `sections ${surveyData.target_sections.join(', ')}`}
                          {surveyData.target_courses.length > 0 && ` taking ${surveyData.target_courses.join(', ')}`}
                          {surveyData.target_years.length > 0 && ` in year ${surveyData.target_years.join(', ')}`}
                        </p>
                      </div>
                    )}

                    {surveyData.target_sections.length === 0 && 
                     surveyData.target_courses.length === 0 && 
                     surveyData.target_years.length === 0 && (
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-sm text-green-800">
                          <strong>This survey will be visible to all students</strong>
                        </p>
                      </div>
                    )}
                  </div>
                )}
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

        {/* Step 2: Add Questions - Keep your existing code */}
        {step === 2 && (
          <div className="space-y-6">
            {/* ... Your existing Step 2 code ... */}
            {/* I'm keeping it the same as you had it */}
            
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