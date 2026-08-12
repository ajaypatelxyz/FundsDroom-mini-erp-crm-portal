import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "/api",
});

// Attach token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401/403, redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && (err.response.status === 401 || err.response.status === 403)) {
      // Only redirect if not already on login
      if (!window.location.pathname.includes("/login")) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      }
    }
    return Promise.reject(err);
  }
);

// ---- Auth ----
export const login = (data) => API.post("/auth/login", data);
export const getMe = () => API.get("/auth/me");
export const seedDB = () => API.post("/auth/seed");

// ---- Dashboard ----
export const getDashboard = () => API.get("/dashboard");

// ---- Customers ----
export const getCustomers = (params) => API.get("/customers", { params });
export const getAllCustomers = () => API.get("/customers/all");
export const getCustomer = (id) => API.get(`/customers/${id}`);
export const createCustomer = (data) => API.post("/customers", data);
export const updateCustomer = (id, data) => API.put(`/customers/${id}`, data);
export const addCustomerNote = (id, note) => API.post(`/customers/${id}/notes`, { note });

// ---- Products ----
export const getProducts = (params) => API.get("/products", { params });
export const getAllProducts = () => API.get("/products/all");
export const getProductCategories = () => API.get("/products/categories");
export const getProduct = (id) => API.get(`/products/${id}`);
export const createProduct = (data) => API.post("/products", data);
export const updateProduct = (id, data) => API.put(`/products/${id}`, data);
export const adjustStock = (id, data) => API.post(`/products/${id}/adjust-stock`, data);

// ---- Stock Movements ----
export const getStockMovements = (params) => API.get("/stock-movements", { params });

// ---- Challans ----
export const getChallans = (params) => API.get("/challans", { params });
export const getChallan = (id) => API.get(`/challans/${id}`);
export const createChallan = (data) => API.post("/challans", data);
export const updateChallanStatus = (id, status) => API.put(`/challans/${id}/status`, { status });

export default API;
