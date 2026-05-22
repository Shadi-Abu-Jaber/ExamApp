class ConfigurationService {
  getApiBaseUrl() {
    return import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  }

  isMockMode() {
    return import.meta.env.VITE_USE_MOCK_API === 'true';
  }
}

const configurationService = new ConfigurationService();

export default configurationService;