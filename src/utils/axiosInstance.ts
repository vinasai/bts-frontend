// // src/utils/axiosInstance.ts

// import axios from "axios";

// const baseURL: string = import.meta.env.VITE_API_BASE_URL as string;

// const axiosInstance = axios.create({
//   baseURL,
//   withCredentials: true, // send cookies automatically
//   headers: { "Content-Type": "application/json" },
//   timeout: 60000,
// });

// const plainAxios = axios.create({
//   baseURL,
//   withCredentials: true,
//   headers: { "Content-Type": "application/json" },
// });

// // Response interceptor for 401 → refresh
// axiosInstance.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config as typeof error.config & { _retry?: boolean };

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       window.location.pathname !== "/login" // <--- check
//     ) {
//       originalRequest._retry = true;

//       try {
//         // refresh token is in cookie
//         await plainAxios.post("/auth/refresh");

//         // retry original request; cookies will be automatically sent
//         return axiosInstance(originalRequest);
//       } catch (refreshError) {
//         window.location.href = "/login";
//         return Promise.reject(refreshError);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;


import axios from "axios";

const baseURLs = {
  main: import.meta.env.VITE_API_BASE_URL as string,
  api2: import.meta.env.VITE_API_BASE_URL2 as string,
  api3: import.meta.env.VITE_API_BASE_URL3 as string,
};

// Default instance (main API)
const axiosInstance = axios.create({
  baseURL: baseURLs.main,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
  timeout: 60000,
});

// Plain instance (for refresh)
const plainAxios = axios.create({
  baseURL: baseURLs.main,
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

// 🚀 Dynamic baseURL routing logic
axiosInstance.interceptors.request.use((config) => {
  if (config.url?.startsWith("/wo")) {
    config.baseURL = baseURLs.api2;
  } else if (config.url?.startsWith("/inv")) {
    config.baseURL = baseURLs.api3;
  } else {
    config.baseURL = baseURLs.main;
  }

  return config;
});


// 🔄 Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      window.location.pathname !== "/login"
    ) {
      originalRequest._retry = true;

      try {
        await plainAxios.post("/auth/refresh");
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
