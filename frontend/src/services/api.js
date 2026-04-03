import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Auto-logout on 401 (skip during initial token validation)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the request was flagged to skip auth redirect (e.g. /auth/me validation), just reject
    if (error.config?._skipAuthRedirect) return Promise.reject(error);

    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// ── Auth (public) ──────────────────────────────────────
export const authService = {
  // Backend: POST /auth/login — body: { username, password }
  // Returns: { jwt, userId, roles }
  login: async (username, password) => {
    const res = await api.post('/auth/login', { username, password });
    return res.data;
  },

  // Backend: POST /auth/signup — body: { username, password, name, roles }
  // Returns: { id, username }
  signup: async (userData) => {
    const res = await api.post('/auth/signup', userData);
    return res.data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
};

// ── Public ─────────────────────────────────────────────
export const publicService = {
  // Backend: GET /public/doctors — returns DoctorResponseDto[]
  getAllDoctors: async () => {
    const res = await api.get('/public/doctors');
    return res.data;
  },

  // Backend: GET /public/stats — returns { totalPatients, totalDoctors, totalAppointments }
  getStats: async () => {
    const res = await api.get('/public/stats');
    return res.data;
  },
};

// ── Patient (ROLE_PATIENT) ─────────────────────────────
export const patientService = {
  createAppointment: async (appointmentData) => {
    const res = await api.post('/patients/appointments', appointmentData);
    return res.data;
  },

  getMyAppointments: async () => {
    const res = await api.get('/patients/appointments');
    return res.data;
  },

  // Payment — GET /patients/payment/config → { secret, fee, currency }
  getPaymentConfig: async () => {
    const res = await api.get('/patients/payment/config');
    return res.data;
  },

  // Payment — POST /patients/payment/create-order → PaymentOrderResponseDto
  createPaymentOrder: async (data) => {
    const res = await api.post('/patients/payment/create-order', data);
    return res.data;
  },

  // Payment — POST /patients/payment/verify → AppointmentResponseDto
  verifyPayment: async (data) => {
    const res = await api.post('/patients/payment/verify', data);
    return res.data;
  },

  // Insurance — GET /patients/insurance → InsuranceResponseDto | null (204)
  getInsurance: async () => {
    const res = await api.get('/patients/insurance');
    return res.status === 204 ? null : res.data;
  },

  // Insurance — POST /patients/insurance → InsuranceResponseDto (add or update)
  saveInsurance: async (data) => {
    const res = await api.post('/patients/insurance', data);
    return res.data;
  },

  // Insurance — DELETE /patients/insurance
  deleteInsurance: async () => {
    await api.delete('/patients/insurance');
  },
};

// ── Doctor (ROLE_DOCTOR | ROLE_ADMIN) ──────────────────
export const doctorService = {
  // Backend: GET /doctors/appointments — returns AppointmentResponseDto[]
  getAppointments: async () => {
    const res = await api.get('/doctors/appointments');
    return res.data;
  },

  // Backend: GET /doctors/patients/{id} — returns PatientDetailResponseDto
  getPatientById: async (id) => {
    const res = await api.get(`/doctors/patients/${id}`);
    return res.data;
  },

  // Backend: PATCH /doctors/appointments/{id}/cancel — cancel appointment & email patient
  cancelAppointment: async (id, cancellationReason = '') => {
    const res = await api.patch(`/doctors/appointments/${id}/cancel`, { cancellationReason });
    return res.data;
  },
};

// ── Admin (ROLE_ADMIN) ─────────────────────────────────
export const adminService = {
  // Patients
  getAllPatients: async (page = 0, size = 10) => {
    const res = await api.get(`/admin/patients?page=${page}&size=${size}`);
    return res.data;
  },
  getPatientById: async (id) => {
    const res = await api.get(`/admin/patients/${id}`);
    return res.data;
  },

  // Doctors
  getAllDoctors: async () => {
    const res = await api.get('/admin/doctors');
    return res.data;
  },
  createDoctorUser: async (userData) => {
    const res = await api.post('/admin/createDoctorUser', userData);
    return res.data;
  },
  onboardDoctor: async (doctorData) => {
    const res = await api.post('/admin/onBoardNewDoctor', doctorData);
    return res.data;
  },
  removeDoctor: async (id) => {
    await api.delete(`/admin/doctors/${id}`);
  },

  // Appointments
  getAllAppointments: async () => {
    const res = await api.get('/admin/appointments');
    return res.data;
  },
  deleteAppointment: async (id) => {
    await api.delete(`/admin/appointments/${id}`);
  },
  cancelAppointment: async (id, cancellationReason = '') => {
    const res = await api.patch(`/admin/appointments/${id}/cancel`, { cancellationReason });
    return res.data;
  },

  // Stats
  getStats: async () => {
    const res = await api.get('/admin/stats');
    return res.data;
  },
};

// ── AI (role-based + public FAQ) ───────────────────────
export const aiService = {
  // POST /ai/summary — DOCTOR or ADMIN only
  // Body: { patientId }
  summary: async (patientId) => {
    const res = await api.post('/ai/summary', { patientId });
    return res.data;
  },

  // POST /ai/qa — authenticated (doctor/admin/patient)
  // Body: { patientId, question }
  qa: async (patientId, question) => {
    const res = await api.post('/ai/qa', { patientId, question });
    return res.data;
  },

  // POST /ai/faq — public, no auth required
  // Body: { question }
  faq: async (question) => {
    const res = await api.post('/ai/faq', { question });
    return res.data;
  },
};


export default api;
