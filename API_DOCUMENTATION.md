# Hospital Management System - API Documentation

Base URL: `http://localhost:8080/api/v1`

---

## 🔐 Authentication

All authenticated endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### 1. Login

**Endpoint:** `POST /auth/login`

**Description:** Authenticate user with email and password

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "userId": 1,
  "username": "john.doe@example.com",
  "roles": ["PATIENT"]
}
```

**Error Response:** `401 Unauthorized`
```json
{
  "timestamp": "2026-02-20T12:00:00",
  "status": 401,
  "error": "Unauthorized",
  "message": "Invalid credentials"
}
```

---

### 2. Sign Up

**Endpoint:** `POST /auth/signup`

**Description:** Register a new user

**Request Body:**
```json
{
  "username": "john.doe@example.com",
  "password": "password123",
  "name": "John Doe",
  "email": "john.doe@example.com",
  "birthDate": "1980-01-15",
  "gender": "MALE",
  "bloodGroup": "O_POSITIVE"
}
```

**Response:** `200 OK`
```json
{
  "userId": 1,
  "username": "john.doe@example.com",
  "message": "User registered successfully",
  "roles": ["PATIENT"]
}
```

**Error Response:** `400 Bad Request`
```json
{
  "timestamp": "2026-02-20T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Email already exists"
}
```

---

## 👤 Patient Endpoints

### 1. Create Appointment

**Endpoint:** `POST /patients/appointments`

**Auth Required:** Yes (PATIENT role)

**Description:** Create a new appointment with a doctor

**Request Body:**
```json
{
  "doctorId": 2,
  "patientId": 1,
  "appointmentTime": "2026-02-25T10:00:00",
  "reason": "Regular checkup"
}
```

**Response:** `201 Created`
```json
{
  "id": 1,
  "appointmentTime": "2026-02-25T10:00:00",
  "reason": "Regular checkup",
  "doctorName": "Dr. Sarah Johnson",
  "patientName": "John Doe",
  "status": "SCHEDULED"
}
```

**Error Responses:**
- `404 Not Found` - Doctor or Patient not found
- `400 Bad Request` - Invalid appointment time
- `403 Forbidden` - User doesn't have permission

---

## 👨‍⚕️ Doctor Endpoints

### 1. Get All Appointments

**Endpoint:** `GET /doctors/appointments`

**Auth Required:** Yes (DOCTOR role)

**Description:** Get all appointments for the logged-in doctor

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "appointmentTime": "2026-02-25T10:00:00",
    "reason": "Regular checkup",
    "patientName": "John Doe",
    "patientAge": 45,
    "patientBloodGroup": "O_POSITIVE",
    "status": "SCHEDULED"
  },
  {
    "id": 2,
    "appointmentTime": "2026-02-25T11:00:00",
    "reason": "Follow-up consultation",
    "patientName": "Jane Smith",
    "patientAge": 32,
    "patientBloodGroup": "A_POSITIVE",
    "status": "SCHEDULED"
  }
]
```

---

## 👨‍💼 Admin Endpoints

### 1. Get All Patients

**Endpoint:** `GET /admin/patients?page=0&size=10`

**Auth Required:** Yes (ADMIN role)

**Description:** Get paginated list of all patients

**Query Parameters:**
- `page` (optional, default: 0) - Page number
- `size` (optional, default: 10) - Page size

**Response:** `200 OK`
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john.doe@example.com",
    "birthDate": "1980-01-15",
    "gender": "MALE",
    "bloodGroup": "O_POSITIVE",
    "createdAt": "2026-01-01T00:00:00"
  },
  {
    "id": 2,
    "name": "Jane Smith",
    "email": "jane.smith@example.com",
    "birthDate": "1992-05-20",
    "gender": "FEMALE",
    "bloodGroup": "A_POSITIVE",
    "createdAt": "2026-01-02T00:00:00"
  }
]
```

---

### 2. Onboard New Doctor

**Endpoint:** `POST /admin/onBoardNewDoctor`

**Auth Required:** Yes (ADMIN role)

**Description:** Register a new doctor in the system

**Request Body:**
```json
{
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@hospital.com",
  "specialization": "Cardiology",
  "username": "sarah.johnson@hospital.com",
  "password": "doctorPass123"
}
```

**Response:** `201 Created`
```json
{
  "id": 2,
  "name": "Dr. Sarah Johnson",
  "email": "sarah.johnson@hospital.com",
  "specialization": "Cardiology",
  "userId": 5
}
```

**Error Response:** `400 Bad Request`
```json
{
  "timestamp": "2026-02-20T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Doctor email already exists"
}
```

---

## 📋 Data Models

### User
```typescript
interface User {
  id: number;
  username: string;
  roles: RoleType[];
  providerType: AuthProviderType;
  providerId?: string;
}
```

### Patient
```typescript
interface Patient {
  id: number;
  name: string;
  email: string;
  birthDate: string; // ISO date format
  gender: string;
  bloodGroup: BloodGroupType;
  createdAt: string; // ISO datetime format
  insurance?: Insurance;
  appointments: Appointment[];
}
```

### Doctor
```typescript
interface Doctor {
  id: number;
  name: string;
  email: string;
  specialization: string;
  userId: number;
  appointments: Appointment[];
  department?: Department;
}
```

### Appointment
```typescript
interface Appointment {
  id: number;
  appointmentTime: string; // ISO datetime format
  reason: string;
  patientId: number;
  patientName?: string;
  doctorId: number;
  doctorName?: string;
  status: AppointmentStatus;
}
```

### Insurance
```typescript
interface Insurance {
  id: number;
  policyNumber: string;
  provider: string;
  validUntil: string; // ISO date format
  createdAt: string; // ISO datetime format
}
```

---

## 🎯 Enums

### RoleType
```typescript
enum RoleType {
  ADMIN = "ADMIN",
  DOCTOR = "DOCTOR",
  PATIENT = "PATIENT"
}
```

### BloodGroupType
```typescript
enum BloodGroupType {
  A_POSITIVE = "A_POSITIVE",
  A_NEGATIVE = "A_NEGATIVE",
  B_POSITIVE = "B_POSITIVE",
  B_NEGATIVE = "B_NEGATIVE",
  AB_POSITIVE = "AB_POSITIVE",
  AB_NEGATIVE = "AB_NEGATIVE",
  O_POSITIVE = "O_POSITIVE",
  O_NEGATIVE = "O_NEGATIVE"
}
```

### AuthProviderType
```typescript
enum AuthProviderType {
  EMAIL = "EMAIL",
  GOOGLE = "GOOGLE",
  GITHUB = "GITHUB",
  FACEBOOK = "FACEBOOK",
  TWITTER = "TWITTER"
}
```

### AppointmentStatus
```typescript
enum AppointmentStatus {
  SCHEDULED = "SCHEDULED",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
  NO_SHOW = "NO_SHOW"
}
```

---

## ❗ Error Handling

All API errors follow this format:

```typescript
interface ApiError {
  timestamp: string; // ISO datetime
  status: number; // HTTP status code
  error: string; // Error type
  message: string; // Error description
  path?: string; // Request path
}
```

### Common Status Codes

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required or failed
- `403 Forbidden` - User doesn't have permission
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (duplicate)
- `500 Internal Server Error` - Server error

---

## 🔒 OAuth2 Authentication

### Google Login

**Endpoint:** `GET /oauth2/authorization/google`

**Description:** Redirects to Google OAuth consent screen

**Flow:**
1. Frontend redirects to this endpoint
2. User authenticates with Google
3. Backend handles callback and creates/updates user
4. Redirects to frontend with JWT token

---

### GitHub Login

**Endpoint:** `GET /oauth2/authorization/github`

**Description:** Redirects to GitHub OAuth consent screen

**Flow:**
1. Frontend redirects to this endpoint
2. User authenticates with GitHub
3. Backend handles callback and creates/updates user
4. Redirects to frontend with JWT token

---

## 📝 Request/Response Examples

### Example: Complete Patient Flow

**1. Sign Up**
```bash
POST /api/v1/auth/signup
Content-Type: application/json

{
  "username": "patient@example.com",
  "password": "securePass123",
  "name": "John Patient",
  "email": "patient@example.com",
  "birthDate": "1990-05-15",
  "gender": "MALE",
  "bloodGroup": "O_POSITIVE"
}
```

**2. Login**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "patient@example.com",
  "password": "securePass123"
}
```

**Response:**
```json
{
  "accessToken": "eyJhbGc...",
  "userId": 10,
  "username": "patient@example.com",
  "roles": ["PATIENT"]
}
```

**3. Create Appointment**
```bash
POST /api/v1/patients/appointments
Authorization: Bearer eyJhbGc...
Content-Type: application/json

{
  "doctorId": 2,
  "patientId": 10,
  "appointmentTime": "2026-03-01T14:30:00",
  "reason": "Annual checkup"
}
```

---

## 🔧 Frontend Integration Tips

### 1. Axios Setup
```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
```

### 2. API Service Example
```javascript
// services/authService.js
import api from './api';

export const authService = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  signup: async (userData) => {
    const response = await api.post('/auth/signup', userData);
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('token');
  }
};

// services/appointmentService.js
export const appointmentService = {
  createAppointment: async (appointmentData) => {
    const response = await api.post('/patients/appointments', appointmentData);
    return response.data;
  },
  
  getDoctorAppointments: async () => {
    const response = await api.get('/doctors/appointments');
    return response.data;
  }
};
```

### 3. React Hook Example
```javascript
import { useState } from 'react';
import { authService } from '../services/authService';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.accessToken);
      localStorage.setItem('user', JSON.stringify(data));
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return { login, loading, error };
};
```

---

## 🧪 Testing Endpoints

### Using cURL

**Login:**
```bash
curl -X POST http://localhost:8080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

**Create Appointment:**
```bash
curl -X POST http://localhost:8080/api/v1/patients/appointments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "doctorId": 2,
    "patientId": 1,
    "appointmentTime": "2026-03-01T14:30:00",
    "reason": "Checkup"
  }'
```

---

## 📚 Additional Resources

- **Backend Repository:** Link to backend repo
- **API Postman Collection:** Available in `/docs/postman`
- **Swagger UI:** Available at `http://localhost:8080/swagger-ui.html` (if configured)

---

This API documentation provides all the necessary information for frontend developers to integrate with the Hospital Management System backend.

