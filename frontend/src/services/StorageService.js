class StorageService {
  constructor() {
    this.tokenKey = 'examflow_token';
  }

  get(key) {
    return window.localStorage.getItem(key);
  }

  set(key, value) {
    window.localStorage.setItem(key, value);
  }

  remove(key) {
    window.localStorage.removeItem(key);
  }

  getToken() {
    return this.get(this.tokenKey);
  }

  setToken(token) {
    this.set(this.tokenKey, token);
  }

  removeToken() {
    this.remove(this.tokenKey);
  }
}

const storageService = new StorageService();

export default storageService;