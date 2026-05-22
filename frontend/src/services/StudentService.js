import apiService from './ApiService';
import configurationService from './ConfigurationService';
import mockDbService from './MockDbService';

class StudentService {
  async listAvailableExams() {
    if (configurationService.isMockMode()) {
      return mockDbService.listAvailableExams();
    }

    const response = await apiService.get('/student/exams');
    return response.data;
  }

  async startExam(examId) {
    if (configurationService.isMockMode()) {
      return mockDbService.startExam(examId);
    }

    const response = await apiService.post(`/student/exams/${examId}/start`);
    return response.data;
  }

  async getExamQuestions(examId) {
    if (configurationService.isMockMode()) {
      return mockDbService.getExamQuestions(examId);
    }

    const response = await apiService.get(`/exams/${examId}/questions`);
    return response.data;
  }

  async listResults() {
    if (configurationService.isMockMode()) {
      return mockDbService.listResults();
    }

    const response = await apiService.get('/student/results');
    return response.data;
  }

  async getResult(examId) {
    if (configurationService.isMockMode()) {
      return mockDbService.getResult(examId);
    }

    const response = await apiService.get(`/student/results/${examId}`);
    return response.data;
  }
}

const studentService = new StudentService();

export default studentService;