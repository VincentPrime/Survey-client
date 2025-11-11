// lib/surveyService.ts
import api, { handleApiError } from './api';
import { Survey, SurveyList, Question, Response, ResponseCreate, AnalyticsData } from '@/types';

export const surveyService = {
  // Get all surveys (filtered by role on backend)
    async getSurveys(): Promise<SurveyList[]> {
    try {
        const response = await api.get('/api/surveys/');
        const data = response.data;
        return Array.isArray(data) ? data : data.results || data.surveys || [];
    } catch (error) {
        throw handleApiError(error);
    }
    },

  // Get survey details
  async getSurvey(id: number): Promise<Survey> {
    try {
      const response = await api.get<Survey>(`/api/surveys/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create survey
  async createSurvey(data: Partial<Survey>): Promise<Survey> {
    try {
      const response = await api.post<Survey>('/api/surveys/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update survey
  async updateSurvey(id: number, data: Partial<Survey>): Promise<Survey> {
    try {
      const response = await api.put<Survey>(`/api/surveys/${id}/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete survey
  async deleteSurvey(id: number): Promise<void> {
    try {
      await api.delete(`/api/surveys/${id}/`);
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Check if student has submitted
  async checkSubmission(surveyId: number): Promise<{ has_submitted: boolean }> {
    try {
      const response = await api.get(`/api/surveys/${surveyId}/check_submission/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get survey analytics
  async getAnalytics(surveyId: number): Promise<AnalyticsData[]> {
    try {
      const response = await api.get<AnalyticsData[]>(`/api/surveys/${surveyId}/analytics/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const questionService = {
  // Get questions for a survey
  async getQuestions(surveyId: number): Promise<Question[]> {
    try {
      const response = await api.get<Question[]>(`/api/questions/?survey_id=${surveyId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Create question
  async createQuestion(data: Partial<Question>): Promise<Question> {
    try {
      const response = await api.post<Question>('/api/questions/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Update question
  async updateQuestion(id: number, data: Partial<Question>): Promise<Question> {
    try {
      const response = await api.put<Question>(`/api/questions/${id}/`, data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Delete question
  async deleteQuestion(id: number): Promise<void> {
    try {
      await api.delete(`/api/questions/${id}/`);
    } catch (error) {
      throw handleApiError(error);
    }
  },
};

export const responseService = {
  // Get student's response history
  async getMyHistory(): Promise<Response[]> {
    try {
      const response = await api.get<Response[]>('/api/responses/my_history/');
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Submit survey response
  async submitResponse(data: ResponseCreate): Promise<Response> {
    try {
      const response = await api.post<Response>('/api/responses/', data);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get responses for a survey (teacher)
  async getResponsesBySurvey(surveyId: number): Promise<Response[]> {
    try {
      const response = await api.get<Response[]>(`/api/responses/by_survey/?survey_id=${surveyId}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },

  // Get single response details
  async getResponse(id: number): Promise<Response> {
    try {
      const response = await api.get<Response>(`/api/responses/${id}/`);
      return response.data;
    } catch (error) {
      throw handleApiError(error);
    }
  },
};