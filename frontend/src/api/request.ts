import axios from 'axios'

const api = axios.create({
  baseURL: '',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' }
})

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    // Silently handle backend unavailable errors
    if (!error.response || error.response.status === 502) {
      console.warn('[API] Backend service unavailable')
    }
    return Promise.reject(error)
  }
)

// Type-safe wrapper: interceptor unwraps AxiosResponse, so .get/.post return data directly
const typedApi = {
  get: <T = any>(url: string, config?: any): Promise<T> => api.get(url, config),
  post: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.post(url, data, config),
  put: <T = any>(url: string, data?: any, config?: any): Promise<T> => api.put(url, data, config),
  delete: <T = any>(url: string, config?: any): Promise<T> => api.delete(url, config)
}

export default typedApi
