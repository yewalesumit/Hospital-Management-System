# Hospital Management System

A full-stack hospital management system with separate backend and frontend.

## 📁 Project Structure
```
hospital-management-system/
├── backend/          ← Spring Boot App
│   └── src/main/java/com/sumit/hospitalManagement/
│       ├── controller/      ← REST API endpoints
│       ├── service/         ← Business logic
│       ├── entity/          ← Database tables (JPA Entities)
│       ├── repository/      ← Database queries (Spring Data)
│       ├── dto/             ← Data Transfer Objects (request/response shapes)
│       ├── security/        ← JWT, OAuth2, Spring Security config
│       ├── ai/              ← AI modules (LLM provider, prompts, audit)
│       └── config/          ← App configuration beans
└── frontend/
    └── src/
        ├── pages/           ← React page components
        │   ├── admin/       ← Admin-only pages
        │   ├── doctor/      ← Doctor-only pages
        │   ├── patient/     ← Patient-only pages
        │   ├── LandingPage  ← Public home page
        │   ├── Login/Signup ← Auth pages
        │   └── FaqBot       ← Public FAQ chatbot
        ├── components/      ← Reusable UI components
        ├── context/         ← React Context (global auth state)
        └── services/        ← API call functions (Axios)
```

## 🚀 Getting Started

### Prerequisites
- Java 21 or higher
- Node.js 18 or higher
- MySQL 8.x
- Maven 3.9+

### Windows (PowerShell) Quick Commands
```powershell
# Backend
Set-Location backend
Copy-Item src/main/resources/application.properties.example src/main/resources/application.properties
Copy-Item src/main/resources/application.yml.example src/main/resources/application.yml
.\mvnw.cmd spring-boot:run

# In a new terminal, frontend
Set-Location frontend
npm install
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Copy the example config files and fill in your local values:
```bash
cp src/main/resources/application.properties.example src/main/resources/application.properties
cp src/main/resources/application.yml.example src/main/resources/application.yml
```

Then configure the database and secrets in `src/main/resources/application.properties` / `application.yml`:
```properties
spring.datasource.url=jdbc:mysql://localhost:3306/hospitalDB
spring.datasource.username=root
spring.datasource.password=your_password
```

3. Run the backend:
```bash
./mvnw spring-boot:run
```

The backend API will be available at: `http://localhost:8080/api/v1`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at: `http://localhost:5173`

---

## 🔐 Security Architecture

### JWT Authentication Flow:
1. User sends email + password to `POST /api/v1/auth/login`
2. Backend validates credentials, generates a **JWT token** (signed with secret key)
3. Frontend stores the token in localStorage
4. Every API request sends `Authorization: Bearer <token>` header
5. `JwtAuthFilter` intercepts every request, validates the token, sets the security context

### Google OAuth2 Flow:
1. User clicks "Login with Google"
2. Redirected to Google's OAuth2 server
3. Google sends back an authorization code
4. Backend exchanges it for user info via `OAuth2SuccessHandler`
5. If user doesn't exist → auto-created in DB
6. JWT token generated and redirected to frontend

### Role-Based Access Control (RBAC):
```
/public/**            → Anyone (no auth)
/auth/login, /signup  → Anyone
/ai/faq               → Anyone (public FAQ)
/ai/qa                → Any logged-in user
/ai/summary           → DOCTOR or ADMIN only
/admin/**             → ADMIN only
/doctors/**           → DOCTOR or ADMIN
/patients/**          → PATIENT or ADMIN
```


## 🎯 Core Features Explained

### 1. 📅 Appointment Booking (Patient)
- Patient selects a doctor, picks date/time, writes reason
- **Payment required** before appointment is confirmed (Razorpay)
- Flow: Select Doctor → Pay ₹500 → Appointment Created

### 2. 💳 Razorpay Payment Integration
- Backend creates a Razorpay **order** → returns `orderId` to frontend
- Frontend opens Razorpay payment popup
- After payment → frontend sends `paymentId + signature` to backend
- Backend **verifies HMAC-SHA256 signature** (security check — prevents fake payments)
- On success → appointment is confirmed and linked to the payment

### 3. 🤖 AI Assistant (3 Types)

| Type | Endpoint | Who Can Use | What It Does |
|---|---|---|---|
| **FAQ Bot** | `/ai/faq` | Anyone (public) | General hospital questions |
| **Patient AI** | `/ai/qa` | Logged-in users | Personalized health Q&A with patient context |
| **Summary** | `/ai/summary` | Doctor, Admin | Generate medical summary of a patient |

**AI Pipeline (in order):**
```
1. Generate requestId (UUID)
2. AiAccessControl.check() → DENY immediately if not allowed
3. PatientContextBuilder.build() → fetch patient data from DB
4. PromptTemplates → inject context into system prompt
5. LlmProvider.complete() → call Ollama (or Mock) and measure latency
6. AiAuditLogger.logAllowed() → persist audit row asynchronously
7. Return AiResponse
```

**LLM Provider Strategy:**
- `ollama.enabled=true` → calls Ollama running locally (LLaMA 3.1 8B)
- `ollama.enabled=false` → `MockLlmProvider` returns test responses (no GPU needed)

### 4. 📧 Email Notifications
- When doctor or admin **cancels an appointment** → patient gets a **professional HTML email**
- Email includes: hospital branding, patient name, doctor name, appointment time, cancellation reason
- Sent **asynchronously** (`@Async`) — API response is instant, email runs in background
- Uses Gmail SMTP with App Password (not plain password)

### 5. 🏥 Insurance Management (Patient)
- Patients can add/update their insurance: Policy Number, Provider Name, Valid Until date
- One-to-one relationship between Patient and Insurance
- Viewable and editable from the Patient Dashboard

### 6. 👨‍⚕️ Doctor Appointment Cancellation
- Doctors see their appointments on the Doctor Dashboard
- Can cancel any appointment with a reason
- Email automatically sent to patient

### 7. 🔧 Admin Features
- **Patient Management**: View all patients, see their details
- **Doctor Management**: View all doctors
- **Onboard Doctor**: Create User + Doctor profile linked together
- **Appointment Management**: View all, cancel any, reassign to different doctor
- **Admin AI Panel**: AI summary for any patient

---

## 🔑 Features

### Backend (Spring Boot)
- **Authentication**: JWT + OAuth2 (Google, GitHub)
- **Authorization**: Role-based access control (ADMIN, DOCTOR, PATIENT)
- **REST API**: Complete CRUD operations for all entities
- **Database**: MySQL with JPA/Hibernate
- **Security**: BCrypt password encryption, JWT tokens

### Frontend (React)
- **User Interface**: Modern, responsive design
- **Authentication**: Login/Signup with social providers
- **Role-based Views**: Different dashboards for Admin, Doctor, and Patient
- **Real-time Updates**: Appointment management, patient records

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/signup` - User registration

### Admin
- `GET /api/v1/admin/patients?page=0&size=10` - Get all patients (paginated)
- `POST /api/v1/admin/onBoardNewDoctor` - Register new doctor

### Patient
- `POST /api/v1/patients/appointments` - Create appointment

### Doctor
- `GET /api/v1/doctors/appointments` - Get all appointments for logged-in doctor

## 🗃️ Database Schema

### Main Entities
- **User**: Base authentication entity
- **Patient**: Patient information and medical records
- **Doctor**: Doctor profiles and specializations
- **Appointment**: Appointment bookings
- **Insurance**: Patient insurance information
- **Department**: Hospital departments


## 🧪 Testing

### Backend Tests
```bash
cd backend
./mvnw test
```

### Frontend Tests
```bash
cd frontend
npm run build
npm run lint
```

## 📝 License

This project is licensed under the MIT License.

## 👥 Contributors

- Sumit Yewale

