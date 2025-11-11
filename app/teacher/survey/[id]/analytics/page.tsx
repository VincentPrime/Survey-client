// app/(teacher)/surveys/[id]/analytics/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { surveyService } from '@/lib/surveyService';
import { Survey, AnalyticsData } from '@/types';

export default function AnalyticsPage() {
  const router = useRouter();
  const params = useParams();
  const surveyId = parseInt(params.id as string);

  const [survey, setSurvey] = useState<Survey | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [surveyId]);

  const loadData = async () => {
    try {
      const [surveyData, analyticsData] = await Promise.all([
        surveyService.getSurvey(surveyId),
        surveyService.getAnalytics(surveyId),
      ]);
      setSurvey(surveyData);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderMCQChart = (data: Record<string, number>) => {
    if (!data || Object.keys(data).length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No data available for this question
        </div>
      );
    }

    const total = Object.values(data).reduce((sum, val) => sum + val, 0);
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

    return (
      <div className="space-y-3">
        {Object.entries(data).map(([option, count], index) => {
          const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
          return (
            <div key={option}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-700">{option}</span>
                <span className="text-sm text-gray-600">{count} ({percentage}%)</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="h-3 rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: colors[index % colors.length],
                  }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderLikertChart = (data: any) => {
    // Safety checks
    if (!data || typeof data !== 'object') {
      return (
        <div className="p-4 text-center text-gray-500">
          No data available for this question
        </div>
      );
    }

    // Check if data has the expected structure
    const distribution = data.distribution || data;
    const average = data.average || 0;

    if (!distribution || typeof distribution !== 'object' || Object.keys(distribution).length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No responses yet for this question
        </div>
      );
    }

    const values = Object.values(distribution);
    const total = values.reduce((sum: number, val: any) => sum + (Number(val) || 0), 0);
    const maxCount = Math.max(...values.map((v: any) => Number(v) || 0));

    return (
      <div>
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {Number(average).toFixed(2)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Average Rating</div>
          </div>
        </div>
        <div className="flex items-end justify-between h-48 space-x-2">
          {Object.entries(distribution)
            .sort(([a], [b]) => parseInt(a) - parseInt(b))
            .map(([value, count]) => {
              const numCount = Number(count) || 0;
              const height = maxCount > 0 ? (numCount / maxCount) * 100 : 0;
              return (
                <div key={value} className="flex-1 flex flex-col items-center">
                  <div className="text-sm font-medium text-gray-600 mb-1">{numCount}</div>
                  <div
                    className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-t transition-all duration-500"
                    style={{ height: `${height}%`, minHeight: numCount > 0 ? '20px' : '0' }}
                  ></div>
                  <div className="text-sm font-medium text-gray-700 mt-2">{value}</div>
                </div>
              );
            })}
        </div>
      </div>
    );
  };

  const renderWordCloud = (data: any) => {
    if (!data || !data.word_frequency || typeof data.word_frequency !== 'object') {
      return (
        <div className="p-4 text-center text-gray-500">
          No word frequency data available
        </div>
      );
    }

    const words = Object.entries(data.word_frequency)
      .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
      .slice(0, 20);
    
    if (words.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No words to display
        </div>
      );
    }

    const maxFreq = Math.max(...words.map(([, freq]) => freq as number));

    return (
      <div className="flex flex-wrap gap-3 justify-center">
        {words.map(([word, freq]) => {
          const numFreq = freq as number;
          const size = 12 + (numFreq / maxFreq) * 20;
          const opacity = 0.5 + (numFreq / maxFreq) * 0.5;
          return (
            <span
              key={word}
              className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full font-medium"
              style={{
                fontSize: `${size}px`,
                opacity,
              }}
            >
              {word} ({numFreq})
            </span>
          );
        })}
      </div>
    );
  };

  const renderTextResponses = (data: any) => {
    if (!data || !data.responses || !Array.isArray(data.responses) || data.responses.length === 0) {
      return (
        <div className="p-4 text-center text-gray-500">
          No text responses available
        </div>
      );
    }

    return (
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {data.responses.map((response: string, index: number) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-700">{response}</p>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{survey?.title}</h1>
              <p className="text-sm text-gray-600">Survey Analytics</p>
            </div>
            <button
              onClick={() => router.push('/teacher/dashboard')}
              className="text-gray-600 hover:text-gray-900 font-medium"
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Questions</p>
                <p className="text-3xl font-bold text-gray-900 mt-1">{analytics.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Responses</p>
                <p className="text-3xl font-bold text-green-600 mt-1">
                  {analytics[0]?.total_responses || 0}
                </p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Rate</p>
                <p className="text-3xl font-bold text-purple-600 mt-1">
                  {analytics[0]?.total_responses > 0 ? '100%' : '0%'}
                </p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Question Analytics */}
        <div className="space-y-6">
          {analytics.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p className="text-gray-500 text-lg">No responses yet</p>
            </div>
          ) : (
            analytics.map((question, index) => (
              <div key={question.question_id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-start mb-6">
                  <span className="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-semibold">
                    {index + 1}
                  </span>
                  <div className="ml-4 flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {question.question_text}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                        {question.question_type === 'mcq' && 'Multiple Choice'}
                        {question.question_type === 'likert' && 'Likert Scale'}
                        {question.question_type === 'short_answer' && 'Short Answer'}
                        {question.question_type === 'long_answer' && 'Long Answer'}
                      </span>
                      <span>{question.total_responses} responses</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6">
                  {question.question_type === 'mcq' && renderMCQChart(question.data as Record<string, number>)}
                  {question.question_type === 'likert' && renderLikertChart(question.data)}
                  {(question.question_type === 'short_answer' || question.question_type === 'long_answer') && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-4">Word Frequency</h4>
                      {renderWordCloud(question.data)}
                      <h4 className="font-medium text-gray-900 mt-6 mb-4">
                        All Responses ({(question.data as any)?.responses?.length || 0})
                      </h4>
                      {renderTextResponses(question.data)}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}