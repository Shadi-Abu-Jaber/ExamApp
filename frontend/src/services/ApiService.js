import axios from 'axios';

import configurationService from './ConfigurationService';
import storageService from './StorageService';
import loggerService from './LoggerService';

class ApiService {
  constructor() {
    this.client = axios.create({
      baseURL: configurationService.getApiBaseUrl(),
    });

    this.client.interceptors.request.use((config) => {
      const token = storageService.getToken();

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    });

    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        loggerService.error('API request failed', error?.response?.data || error);
        return Promise.reject(error);
      }
    );
  }

  get(url, config = {}) {
    return this.client.get(url, config);
  }

  post(url, payload = {}, config = {}) {
    return this.client.post(url, payload, config);
  }

  patch(url, payload = {}, config = {}) {
    return this.client.patch(url, payload, config);
  }

  delete(url, config = {}) {
    return this.client.delete(url, config);
  }
}

const apiService = new ApiService();

export default apiService;