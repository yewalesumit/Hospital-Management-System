# AGENTS.md

## Project snapshot
- Monorepo with `backend/` (Spring Boot REST API) and `frontend/` (Vite + React).
- Backend runs under `http://localhost:8080/api/v1` because `server.servlet.context-path=/api/v1` in `backend/src/main/resources/application.properties`.
- Frontend talks to that API through `frontend/src/services/api.js` (`axios` base URL: `http://localhost:8080/api/v1`).

## Architecture to preserve
- Backend layers are split by package: `controller`, `service`, `repository`, `entity`, `dto`, `security`, `config`, `ai`, and `error` under `backend/src/main/java/com/sumit/hospitalManagement/`.
- Core domain entities include `User`, `Patient`, `Doctor`, `Appointment`, `Insurance`, `Department`, `Payment`, and `AiAuditLog`.
- Security is centralized in `security/WebSecurityConfig.java`: `/public/**`, `/auth/login`, `/auth/signup`, and `/ai/faq` are public; `/auth/me` is authenticated; `/admin/**`, `/doctors/**`, `/patients/**`, and `/ai/summary` are role-gated.
- Auth flows are in `controller/AuthController.java` (`/auth/login`, `/auth/signup`, `/auth/me`) and the role-specific controllers (`AdminController`, `DoctorController`, `PatientController`, `AiController`).

## Frontend conventions
- Route and role handling lives in `frontend/src/App.jsx`.
- Session state is restored from `localStorage` in `frontend/src/context/AuthContext.jsx`; JWT is stored as `token` and the serialized user as `user`.
- All API calls should go through `frontend/src/services/api.js`, which attaches the JWT via an axios interceptor and redirects to `/login` on `401`.
- Route guards use `frontend/src/components/ProtectedRoute.jsx`; role checks are string-based (`ADMIN`, `DOCTOR`, `PATIENT`).
- UI is organized by feature under `frontend/src/pages/` (`patient/`, `doctor/`, `admin/`) with shared pieces in `frontend/src/components/`.

## Workflow commands that actually match this repo
- Backend dev: `cd backend; ./mvnw spring-boot:run` (`mvnw.cmd` on Windows).
- Backend tests: `cd backend; ./mvnw test`.
- Frontend dev: `cd frontend; npm install; npm run dev`.
- Frontend checks: `cd frontend; npm run build; npm run lint; npm run preview`.
- Note: several root docs mention `npm start`, but `frontend/package.json` only defines `dev`, `build`, `lint`, and `preview`.

## Integration points worth checking before changes
- Public landing data comes from `GET /public/doctors` and `GET /public/stats` (`HospitalController`).
- Patient flows use `/patients/appointments` and `/patients/insurance`.
- Doctor flows use `/doctors/appointments`, `/doctors/patients/{id}`, and cancel endpoints.
- Admin flows use `/admin/patients`, `/admin/doctors`, `/admin/onBoardNewDoctor`, `/admin/appointments`, and `/admin/stats`.
- AI endpoints are split by privilege: `/ai/faq` (public), `/ai/qa` (authenticated), `/ai/summary` (doctor/admin only).

## Repo-specific caution
- `backend/src/main/resources/application.properties` currently contains local database, JWT, Razorpay, and SMTP values; treat it as sensitive and avoid casual edits.
- For contract changes, update the frontend service methods and the matching backend DTO/controller together so route names and payload shapes stay aligned.

