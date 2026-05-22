class NotifyService {
  getErrorMessage(error, fallbackMessage = 'Something went wrong.') {
    return (
      error?.response?.data?.message ||
      error?.message ||
      fallbackMessage
    );
  }

  success(message) {
    return message;
  }

  error(message) {
    return message;
  }
}

const notifyService = new NotifyService();

export default notifyService;