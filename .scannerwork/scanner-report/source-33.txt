import axios from 'axios';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

const createClient = () => {
  const client = axios.create({
    baseURL: process.env.API_BASE_URL,
    timeout: 10000,
  });

  client.interceptors.response.use(null, async (error) => {
    const config = error.config;
    config._retryCount = config._retryCount || 0;

    if (shouldRetry(error) && config._retryCount < MAX_RETRIES) {
      config._retryCount += 1;
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return client(config);
    }

    return Promise.reject(error);
  });

  return client;
};

function shouldRetry(error) {
  return (
    !error.response ||
    error.response.status >= 500 ||
    error.code === 'ECONNABORTED'
  );
}

export default createClient();
