import apiService from './ApiService';
import configurationService from './ConfigurationService';
import mockDbService from './MockDbService';

class SubmissionService {
  async getSubmission(submissionId) {
    if (configurationService.isMockMode()) {
      return mockDbService.getSubmission(submissionId);
    }

    const response = await apiService.get(
      `/student/submissions/${submissionId}`
    );

    return response.data;
  }

  async saveAnswer(submissionId, payload) {
    if (configurationService.isMockMode()) {
      return mockDbService.saveAnswer(submissionId, payload);
    }

    const response = await apiService.post(
      `/student/submissions/${submissionId}/answers/autosave`,
      payload
    );

    return response.data;
  }

  async submitExam(submissionId) {
    if (configurationService.isMockMode()) {
      return mockDbService.submitExam(submissionId);
    }

    const response = await apiService.post(
      `/student/submissions/${submissionId}/submit`
    );

    return response.data;
  }
}

const submissionService = new SubmissionService();

export default submissionService;