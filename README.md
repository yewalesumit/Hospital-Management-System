# Hospital Management System

A full-stack hospital management system with separate backend and frontend.

## 📁 Project Structure

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

## 🔐 Security

- JWT-based authentication
- OAuth2 integration (Google, GitHub)
- Role-based access control
- Password encryption with BCrypt
- CORS configuration for frontend integration

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

