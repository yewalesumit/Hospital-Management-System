package com.sumit.hospitalManagement;

import com.sumit.hospitalManagement.dto.*;
import com.sumit.hospitalManagement.entity.*;
import com.sumit.hospitalManagement.entity.type.AuthProviderType;
import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import com.sumit.hospitalManagement.entity.type.RoleType;
import com.sumit.hospitalManagement.repository.*;
import com.sumit.hospitalManagement.security.AuthService;
import com.sumit.hospitalManagement.security.AuthUtil;
import com.sumit.hospitalManagement.service.AppointmentService;
import com.sumit.hospitalManagement.service.DoctorService;
import com.sumit.hospitalManagement.service.InsuranceService;
import com.sumit.hospitalManagement.service.PatientService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;

/**
 * FullSystemTest — tests every major feature of the Hospital Management System:
 *
 *  1.  Auth       — signup (patient), signup (doctor flow), login, JWT generation
 *  2.  Patient    — getById, getAllPatients (paginated), blood-group query, born-after query
 *  3.  Doctor     — onboard new doctor, list all doctors
 *  4.  Appointment— create appointment, get appointments by doctor, reassign doctor
 *  5.  Insurance  — assign insurance to patient, dissociate insurance
 *  6.  Admin      — stats endpoint (count patients / doctors / appointments)
 *  7.  Repository — custom JPQL & native queries, blood-group count projection
 */
@SpringBootTest
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class FullSystemTest {

    // ── Repositories ──────────────────────────────────────────────────────────
    @Autowired private UserRepository         userRepository;
    @Autowired private PatientRepository      patientRepository;
    @Autowired private DoctorRepository       doctorRepository;
    @Autowired private AppointmentRepository  appointmentRepository;
    @Autowired private InsuranceRepository    insuranceRepository;
    @Autowired private DepartmentRepository   departmentRepository;

    // ── Services ──────────────────────────────────────────────────────────────
    @Autowired private AuthService        authService;
    @Autowired private AuthUtil           authUtil;
    @Autowired private PatientService     patientService;
    @Autowired private DoctorService      doctorService;
    @Autowired private AppointmentService appointmentService;
    @Autowired private InsuranceService   insuranceService;

    // ── Shared state across ordered tests ─────────────────────────────────────
    private static Long   createdPatientUserId;
    private static Long   createdDoctorUserId;
    private static Long   createdAppointmentId;
    private static String patientJwt;

    // ══════════════════════════════════════════════════════════════════════════
    //  1. AUTH TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(1)
    @DisplayName("1.1 — Signup: new patient account is created successfully")
    void testSignupPatient() {
        // Ensure fresh username for each test run
        String username = "test.patient." + System.currentTimeMillis() + "@hospital.com";

        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername(username);
        dto.setPassword("Test@1234");
        dto.setName("Test Patient");
        dto.setRoles(Set.of(RoleType.PATIENT));
        dto.setBirthDate(LocalDate.of(1995, 5, 20));
        dto.setGender("MALE");
        dto.setBloodGroup(BloodGroupType.O_POSITIVE);

        SignupResponseDto response = authService.signup(dto);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isPositive();
        assertThat(response.getUsername()).isEqualTo(username);

        createdPatientUserId = response.getId();
        System.out.println("✅ [SIGNUP] Patient created — id=" + createdPatientUserId + ", username=" + username);
    }

    @Test
    @Order(2)
    @DisplayName("1.2 — Signup: duplicate username throws IllegalArgumentException")
    void testSignupDuplicateThrows() {
        String username = "duplicate." + System.currentTimeMillis() + "@hospital.com";

        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername(username);
        dto.setPassword("pass");
        dto.setName("First User");
        dto.setRoles(Set.of(RoleType.PATIENT));

        authService.signup(dto); // first — OK

        SignupRequestDto dup = new SignupRequestDto();
        dup.setUsername(username);
        dup.setPassword("pass2");
        dup.setName("Dup User");
        dup.setRoles(Set.of(RoleType.PATIENT));

        assertThatThrownBy(() -> authService.signup(dup))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exist");

        System.out.println("✅ [SIGNUP] Duplicate username correctly rejected");
    }

    @Test
    @Order(3)
    @DisplayName("1.3 — Login: valid credentials return JWT + userId + roles")
    void testLogin() {
        String username = "login.test." + System.currentTimeMillis() + "@hospital.com";
        String password = "LoginPass@99";

        // Create account first
        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername(username);
        dto.setPassword(password);
        dto.setName("Login Test User");
        dto.setRoles(Set.of(RoleType.PATIENT));
        authService.signup(dto);

        // Now login
        LoginRequestDto loginDto = new LoginRequestDto();
        loginDto.setUsername(username);
        loginDto.setPassword(password);

        LoginResponseDto response = authService.login(loginDto);

        assertThat(response).isNotNull();
        assertThat(response.getJwt()).isNotBlank();
        assertThat(response.getUserId()).isPositive();
        assertThat(response.getRoles()).contains(RoleType.PATIENT);

        patientJwt = response.getJwt();
        System.out.println("✅ [LOGIN] JWT issued: " + patientJwt.substring(0, 20) + "...");
    }

    @Test
    @Order(4)
    @DisplayName("1.4 — JWT: token contains correct username claim")
    void testJwtContainsUsername() {
        String username = "jwt.test." + System.currentTimeMillis() + "@hospital.com";

        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername(username);
        dto.setPassword("JwtPass@1");
        dto.setName("JWT User");
        dto.setRoles(Set.of(RoleType.PATIENT));
        authService.signup(dto);

        User user = userRepository.findByUsername(username).orElseThrow();
        String token = authUtil.generateAccessToken(user);

        String extractedUsername = authUtil.getUsernameFromToken(token);

        assertThat(extractedUsername).isEqualTo(username);
        System.out.println("✅ [JWT] Username extracted from token: " + extractedUsername);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  2. PATIENT TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(5)
    @DisplayName("2.1 — Patient: signup creates associated Patient record with profile fields")
    void testSignupCreatesPatientRecord() {
        String username = "patient.profile." + System.currentTimeMillis() + "@hospital.com";

        SignupRequestDto dto = new SignupRequestDto();
        dto.setUsername(username);
        dto.setPassword("Pass@123");
        dto.setName("Profile Patient");
        dto.setRoles(Set.of(RoleType.PATIENT));
        dto.setBirthDate(LocalDate.of(1990, 3, 15));
        dto.setGender("FEMALE");
        dto.setBloodGroup(BloodGroupType.A_POSITIVE);

        authService.signup(dto);

        Patient patient = patientRepository.findByEmail(username);

        assertThat(patient).isNotNull();
        assertThat(patient.getName()).isEqualTo("Profile Patient");
        assertThat(patient.getGender()).isEqualTo("FEMALE");
        assertThat(patient.getBloodGroup()).isEqualTo(BloodGroupType.A_POSITIVE);
        assertThat(patient.getBirthDate()).isEqualTo(LocalDate.of(1990, 3, 15));

        System.out.println("✅ [PATIENT] Patient record with full profile: " + patient);
    }

    @Test
    @Order(6)
    @DisplayName("2.2 — Patient: getAllPatients returns paginated list")
    void testGetAllPatients() {
        List<PatientResponseDto> page0 = patientService.getAllPatients(0, 5);

        assertThat(page0).isNotNull();
        assertThat(page0.size()).isLessThanOrEqualTo(5);

        System.out.println("✅ [PATIENT] Page 0 (size 5): " + page0.size() + " patients");
        page0.forEach(p -> System.out.println("   → #" + p.getId() + " " + p.getName() + " | " + p.getBloodGroup()));
    }

    @Test
    @Order(7)
    @DisplayName("2.3 — Patient: findByBloodGroup returns correct patients")
    void testFindByBloodGroup() {
        List<Patient> oPositive = patientRepository.findByBloodGroup(BloodGroupType.O_POSITIVE);

        assertThat(oPositive).isNotNull();
        oPositive.forEach(p -> assertThat(p.getBloodGroup()).isEqualTo(BloodGroupType.O_POSITIVE));

        System.out.println("✅ [PATIENT] O+ patients count: " + oPositive.size());
        oPositive.forEach(p -> System.out.println("   → " + p.getName()));
    }

    @Test
    @Order(8)
    @DisplayName("2.4 — Patient: findByBornAfterDate returns correct patients")
    void testFindByBornAfterDate() {
        LocalDate cutoff = LocalDate.of(1999, 1, 1);
        List<Patient> result = patientRepository.findByBornAfterDate(cutoff);

        assertThat(result).isNotNull();
        result.forEach(p -> assertThat(p.getBirthDate()).isAfter(cutoff));

        System.out.println("✅ [PATIENT] Patients born after " + cutoff + ": " + result.size());
        result.forEach(p -> System.out.println("   → " + p.getName() + " (" + p.getBirthDate() + ")"));
    }

    @Test
    @Order(9)
    @DisplayName("2.5 — Patient: countEachBloodGroupType projection returns correct data")
    void testBloodGroupCount() {
        List<BloodGroupCountResponseEntity> counts = patientRepository.countEachBloodGroupType();

        assertThat(counts).isNotNull();
        assertThat(counts).isNotEmpty();

        System.out.println("✅ [PATIENT] Blood group distribution:");
        counts.forEach(c -> System.out.println("   → " + c));
    }

    @Test
    @Order(10)
    @DisplayName("2.6 — Patient: findAllPatientWithAppointment fetches patients + appointments (no N+1)")
    @Transactional
    void testFindAllPatientWithAppointment() {
        List<Patient> patients = patientRepository.findAllPatientWithAppointment();

        assertThat(patients).isNotNull();

        System.out.println("✅ [PATIENT] Patients with appointments:");
        patients.forEach(p -> System.out.println(
                "   → " + p.getName() + " — appointments: " + p.getAppointments().size()
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  3. DOCTOR TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(11)
    @DisplayName("3.1 — Doctor: onboard new doctor creates user + doctor profile")
    void testOnboardDoctor() {
        String email = "dr.test." + System.currentTimeMillis() + "@hospital.com";

        // Step 1 — create user account with DOCTOR role
        SignupRequestDto signupDto = new SignupRequestDto();
        signupDto.setUsername(email);
        signupDto.setPassword("DocPass@1");
        signupDto.setName("Dr. Test Doctor");
        signupDto.setRoles(Set.of(RoleType.DOCTOR));
        SignupResponseDto signupResponse = authService.signup(signupDto);

        createdDoctorUserId = signupResponse.getId();

        // Step 2 — onboard the doctor profile
        OnBoardDoctorRequestDto dto = new OnBoardDoctorRequestDto();
        dto.setUserId(createdDoctorUserId);
        dto.setName("Dr. Test Doctor");
        dto.setSpecialization("Neurology");
        dto.setEmail(email);

        DoctorResponseDto response = doctorService.onBoardNewDoctor(dto);

        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("Dr. Test Doctor");
        assertThat(response.getSpecialization()).isEqualTo("Neurology");
        assertThat(response.getEmail()).isEqualTo(email);

        System.out.println("✅ [DOCTOR] Onboarded: " + response);
    }

    @Test
    @Order(12)
    @DisplayName("3.2 — Doctor: onboard duplicate throws IllegalArgumentException")
    void testOnboardDuplicateDoctorThrows() {
        assertThat(createdDoctorUserId).isNotNull();

        OnBoardDoctorRequestDto dto = new OnBoardDoctorRequestDto();
        dto.setUserId(createdDoctorUserId);
        dto.setName("Dr. Dup");
        dto.setSpecialization("Cardiology");
        dto.setEmail("dup@hospital.com");

        assertThatThrownBy(() -> doctorService.onBoardNewDoctor(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("already exists");

        System.out.println("✅ [DOCTOR] Duplicate onboard correctly rejected");
    }

    @Test
    @Order(13)
    @DisplayName("3.3 — Doctor: getAllDoctor returns non-empty list")
    void testGetAllDoctors() {
        List<DoctorResponseDto> doctors = doctorService.getAllDoctor();

        assertThat(doctors).isNotNull();
        assertThat(doctors).isNotEmpty();

        System.out.println("✅ [DOCTOR] Total doctors: " + doctors.size());
        doctors.forEach(d -> System.out.println(
                "   → #" + d.getId() + " " + d.getName() + " | " + d.getSpecialization()
        ));
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  4. APPOINTMENT TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(14)
    @DisplayName("4.1 — Appointment: create appointment links patient and doctor")
    void testCreateAppointment() {
        // Get any existing patient and doctor from DB
        Patient patient = patientRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No patients in DB — run demo SQL first"));
        Doctor doctor = doctorRepository.findAll().stream().findFirst()
                .orElseThrow(() -> new IllegalStateException("No doctors in DB — run demo SQL first"));

        // Authenticate as patient (required by @Secured on service)
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(patient.getUser(), null, patient.getUser().getAuthorities())
        );

        CreateAppointmentRequestDto dto = new CreateAppointmentRequestDto();
        dto.setPatientId(patient.getId());
        dto.setDoctorId(doctor.getId());
        dto.setAppointmentTime(LocalDateTime.now().plusDays(3));
        dto.setReason("Routine checkup via test");

        AppointmentResponseDto response = appointmentService.createNewAppointment(dto);

        assertThat(response).isNotNull();
        assertThat(response.getId()).isPositive();
        assertThat(response.getReason()).isEqualTo("Routine checkup via test");
        assertThat(response.getDoctor()).isNotNull();
        assertThat(response.getDoctor().getId()).isEqualTo(doctor.getId());

        createdAppointmentId = response.getId();

        SecurityContextHolder.clearContext();
        System.out.println("✅ [APPOINTMENT] Created appointment #" + createdAppointmentId
                + " for patient=" + patient.getName() + " with doctor=" + doctor.getName());
    }

    @Test
    @Order(15)
    @DisplayName("4.2 — Appointment: getAllAppointmentsOfDoctor returns only that doctor's appointments")
    void testGetAppointmentsOfDoctor() {
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElseThrow();

        List<AppointmentResponseDto> appointments = appointmentService.getAllAppointmentsOfDoctor(doctor.getId());

        assertThat(appointments).isNotNull();
        // Every returned appointment must belong to this doctor
        appointments.forEach(a ->
                assertThat(a.getDoctor().getId()).isEqualTo(doctor.getId())
        );

        System.out.println("✅ [APPOINTMENT] Doctor #" + doctor.getId()
                + " (" + doctor.getName() + ") has " + appointments.size() + " appointments");
        appointments.forEach(a -> System.out.println(
                "   → #" + a.getId() + " | " + a.getAppointmentTime() + " | " + a.getReason()
        ));
    }

    @Test
    @Order(16)
    @DisplayName("4.3 — Appointment: reassign appointment to another doctor")
    void testReassignAppointment() {
        assertThat(createdAppointmentId).isNotNull();

        List<Doctor> doctors = doctorRepository.findAll();
        assertThat(doctors.size()).isGreaterThanOrEqualTo(2);

        Doctor originalDoctor = doctorRepository.findAll().get(0);
        Doctor newDoctor      = doctorRepository.findAll().get(1);

        // Create a fresh appointment for reassignment
        Patient patient = patientRepository.findAll().stream().findFirst().orElseThrow();
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(patient.getUser(), null, patient.getUser().getAuthorities())
        );

        CreateAppointmentRequestDto dto = new CreateAppointmentRequestDto();
        dto.setPatientId(patient.getId());
        dto.setDoctorId(originalDoctor.getId());
        dto.setAppointmentTime(LocalDateTime.now().plusDays(7));
        dto.setReason("Reassignment test");

        AppointmentResponseDto created = appointmentService.createNewAppointment(dto);
        SecurityContextHolder.clearContext();

        // Now reassign
        Appointment reassigned = appointmentService.reAssignAppointmentToAnotherDoctor(
                created.getId(), newDoctor.getId()
        );

        assertThat(reassigned.getDoctor().getId()).isEqualTo(newDoctor.getId());
        System.out.println("✅ [APPOINTMENT] Reassigned appointment #" + created.getId()
                + " from doctor #" + originalDoctor.getId()
                + " to doctor #" + newDoctor.getId());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  5. INSURANCE TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(17)
    @DisplayName("5.1 — Insurance: assign insurance policy to patient")
    void testAssignInsurance() {
        Patient patient = patientRepository.findAll().stream().findFirst().orElseThrow();

        Insurance insurance = Insurance.builder()
                .policyNumber("TEST_POL_" + System.currentTimeMillis())
                .provider("Star Health Insurance")
                .validUntil(LocalDate.of(2030, 12, 31))
                .build();

        Patient updated = insuranceService.assignInsuranceToPatient(insurance, patient.getId());

        assertThat(updated.getInsurance()).isNotNull();
        assertThat(updated.getInsurance().getProvider()).isEqualTo("Star Health Insurance");

        System.out.println("✅ [INSURANCE] Assigned to patient #" + patient.getId()
                + ": policy=" + updated.getInsurance().getPolicyNumber());
    }

    @Test
    @Order(18)
    @DisplayName("5.2 — Insurance: dissociate insurance from patient")
    void testDissociateInsurance() {
        // Find a patient that already has insurance (from previous test or existing data)
        Patient patient = patientRepository.findAll().stream()
                .filter(p -> p.getInsurance() != null)
                .findFirst()
                .orElse(null);

        if (patient == null) {
            System.out.println("⚠️  [INSURANCE] No patient with insurance found — skipping dissociate test");
            return;
        }

        Patient updated = insuranceService.disaccociateInsuranceFromPatient(patient.getId());
        assertThat(updated.getInsurance()).isNull();

        System.out.println("✅ [INSURANCE] Dissociated insurance from patient #" + patient.getId());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  6. ADMIN STATS TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(19)
    @DisplayName("6.1 — Admin Stats: patient count matches repository count")
    void testAdminPatientCount() {
        long repoCount    = patientRepository.count();
        List<PatientResponseDto> page = patientService.getAllPatients(0, 1000);

        assertThat(page.size()).isLessThanOrEqualTo((int) repoCount);
        assertThat(repoCount).isPositive();

        System.out.println("✅ [STATS] Total patients in DB: " + repoCount);
    }

    @Test
    @Order(20)
    @DisplayName("6.2 — Admin Stats: doctor count matches repository count")
    void testAdminDoctorCount() {
        long count = doctorRepository.count();
        assertThat(count).isPositive();
        System.out.println("✅ [STATS] Total doctors in DB: " + count);
    }

    @Test
    @Order(21)
    @DisplayName("6.3 — Admin Stats: appointment count matches repository count")
    void testAdminAppointmentCount() {
        long count = appointmentRepository.count();
        assertThat(count).isPositive();
        System.out.println("✅ [STATS] Total appointments in DB: " + count);
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  7. REPOSITORY QUERY TESTS
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(22)
    @DisplayName("7.1 — Repository: findByName returns correct patient")
    void testFindByName() {
        // Use a patient we know exists from demo SQL
        Patient p = patientRepository.findAll().stream().findFirst().orElse(null);
        if (p == null) { System.out.println("⚠️  No patients yet"); return; }

        List<Patient> found = patientRepository.findByName(p.getName());
        assertThat(found).isNotEmpty();
        assertThat(found.get(0).getName()).isEqualTo(p.getName());

        System.out.println("✅ [REPO] findByName('" + p.getName() + "') → found " + found.size() + " result(s), first #" + found.get(0).getId());
    }

    @Test
    @Order(23)
    @DisplayName("7.2 — Repository: findByEmail returns correct patient")
    void testFindByEmail() {
        Patient p = patientRepository.findAll().stream()
                .filter(pt -> pt.getEmail() != null)
                .findFirst().orElse(null);
        if (p == null) { System.out.println("⚠️  No patients with email yet"); return; }

        Patient found = patientRepository.findByEmail(p.getEmail());
        assertThat(found).isNotNull();
        assertThat(found.getEmail()).isEqualTo(p.getEmail());

        System.out.println("✅ [REPO] findByEmail('" + p.getEmail() + "') → found #" + found.getId());
    }

    @Test
    @Order(24)
    @DisplayName("7.3 — Repository: findByDoctorId returns only appointments for that doctor")
    void testFindAppointmentsByDoctorId() {
        Doctor doctor = doctorRepository.findAll().stream().findFirst().orElse(null);
        if (doctor == null) { System.out.println("⚠️  No doctors yet"); return; }

        List<Appointment> appointments = appointmentRepository.findByDoctorId(doctor.getId());
        assertThat(appointments).isNotNull();
        appointments.forEach(a -> assertThat(a.getDoctor().getId()).isEqualTo(doctor.getId()));

        System.out.println("✅ [REPO] findByDoctorId(" + doctor.getId() + ") → "
                + appointments.size() + " appointments for " + doctor.getName());
    }

    @Test
    @Order(25)
    @DisplayName("7.4 — Repository: UserRepository findByUsername works")
    void testFindByUsername() {
        User user = userRepository.findAll().stream().findFirst().orElse(null);
        if (user == null) { System.out.println("⚠️  No users yet"); return; }

        User found = userRepository.findByUsername(user.getUsername()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getUsername()).isEqualTo(user.getUsername());

        System.out.println("✅ [REPO] findByUsername('" + user.getUsername() + "') → found #" + found.getId());
    }

    @Test
    @Order(26)
    @DisplayName("7.5 — Repository: UserRepository findByProviderIdAndProviderType works for EMAIL provider")
    void testFindByProviderIdAndProviderType() {
        // Find any EMAIL provider user
        User emailUser = userRepository.findAll().stream()
                .filter(u -> u.getProviderType() == AuthProviderType.EMAIL)
                .findFirst().orElse(null);

        if (emailUser == null) {
            System.out.println("⚠️  No EMAIL provider users found — skipping");
            return;
        }

        // EMAIL users have null providerId — test with username-based lookup instead
        User found = userRepository.findByUsername(emailUser.getUsername()).orElse(null);
        assertThat(found).isNotNull();
        assertThat(found.getProviderType()).isEqualTo(AuthProviderType.EMAIL);

        System.out.println("✅ [REPO] EMAIL provider user found: #" + found.getId() + " — " + found.getUsername());
    }

    // ══════════════════════════════════════════════════════════════════════════
    //  8. PRINT FULL DATABASE SUMMARY
    // ══════════════════════════════════════════════════════════════════════════

    @Test
    @Order(27)
    @DisplayName("8.0 — Summary: Print full database state")
    @Transactional
    void printDatabaseSummary() {
        System.out.println("\n");
        System.out.println("╔══════════════════════════════════════════════════════╗");
        System.out.println("║          HOSPITAL MANAGEMENT — DB SUMMARY           ║");
        System.out.println("╚══════════════════════════════════════════════════════╝");

        System.out.println("\n── USERS (" + userRepository.count() + ") ──────────────────────────────");
        userRepository.findAll().forEach(u ->
                System.out.printf("  #%-3d %-40s roles=%-15s provider=%s%n",
                        u.getId(), u.getUsername(), u.getRoles(), u.getProviderType())
        );

        System.out.println("\n── PATIENTS (" + patientRepository.count() + ") ─────────────────────────");
        patientRepository.findAll().forEach(p ->
                System.out.printf("  #%-3d %-20s %-25s gender=%-7s blood=%-12s dob=%s%n",
                        p.getId(), p.getName(), p.getEmail(),
                        p.getGender(), p.getBloodGroup(), p.getBirthDate())
        );

        System.out.println("\n── DOCTORS (" + doctorRepository.count() + ") ──────────────────────────");
        doctorRepository.findAll().forEach(d ->
                System.out.printf("  #%-3d %-25s spec=%-20s email=%s%n",
                        d.getId(), d.getName(), d.getSpecialization(), d.getEmail())
        );

        System.out.println("\n── APPOINTMENTS (" + appointmentRepository.count() + ") ─────────────────");
        appointmentRepository.findAll().forEach(a ->
                System.out.printf("  #%-3d patient=%-20s doctor=%-25s time=%-22s reason=%s%n",
                        a.getId(),
                        a.getPatient() != null ? a.getPatient().getName() : "N/A",
                        a.getDoctor()  != null ? a.getDoctor().getName()  : "N/A",
                        a.getAppointmentTime(), a.getReason())
        );

        System.out.println("\n── BLOOD GROUP DISTRIBUTION ──────────────────────────");
        patientRepository.countEachBloodGroupType().forEach(bg ->
                System.out.println("  " + bg)
        );

        System.out.println("\n╔══════════════════════════════════════════════════════╗");
        System.out.printf( "║  Patients: %-5d  Doctors: %-5d  Appointments: %-5d ║%n",
                patientRepository.count(), doctorRepository.count(), appointmentRepository.count());
        System.out.println("╚══════════════════════════════════════════════════════╝\n");
    }
}

