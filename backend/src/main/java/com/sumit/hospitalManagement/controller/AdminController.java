package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.AppointmentResponseDto;
import com.sumit.hospitalManagement.dto.CancelAppointmentRequestDto;
import com.sumit.hospitalManagement.dto.DoctorResponseDto;
import com.sumit.hospitalManagement.dto.OnBoardDoctorRequestDto;
import com.sumit.hospitalManagement.dto.PatientDetailResponseDto;
import com.sumit.hospitalManagement.dto.PatientResponseDto;
import com.sumit.hospitalManagement.dto.SignupRequestDto;
import com.sumit.hospitalManagement.dto.SignupResponseDto;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import com.sumit.hospitalManagement.repository.DoctorRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import com.sumit.hospitalManagement.security.AuthService;
import com.sumit.hospitalManagement.service.AppointmentService;
import com.sumit.hospitalManagement.service.DoctorService;
import com.sumit.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
public class AdminController {

    private final PatientService patientService;
    private final DoctorService doctorService;
    private final AppointmentService appointmentService;
    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final AuthService authService;

    // ── Patients ──────────────────────────────────────────────────────────────

    @GetMapping("/patients")
    public ResponseEntity<List<PatientResponseDto>> getAllPatients(
            @RequestParam(value = "page", defaultValue = "0") Integer pageNumber,
            @RequestParam(value = "size", defaultValue = "10") Integer pageSize
    ) {
        return ResponseEntity.ok(patientService.getAllPatients(pageNumber, pageSize));
    }

    @GetMapping("/patients/{id}")
    public ResponseEntity<PatientDetailResponseDto> getPatientDetail(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatientDetail(id));
    }

    // ── Doctors ───────────────────────────────────────────────────────────────

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponseDto>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctor());
    }

    @PostMapping("/onBoardNewDoctor")
    public ResponseEntity<DoctorResponseDto> onBoardNewDoctor(@RequestBody OnBoardDoctorRequestDto onBoardDoctorRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(doctorService.onBoardNewDoctor(onBoardDoctorRequestDto));
    }

    /** Admin: create a user account with DOCTOR role (step 1 of onboarding) */
    @PostMapping("/createDoctorUser")
    public ResponseEntity<SignupResponseDto> createDoctorUser(@RequestBody SignupRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.createDoctorUser(dto));
    }

    /** Admin: remove a doctor by their user ID */
    @DeleteMapping("/doctors/{id}")
    public ResponseEntity<Void> removeDoctor(@PathVariable Long id) {
        doctorService.removeDoctor(id);
        return ResponseEntity.noContent().build();
    }

    // ── Appointments ──────────────────────────────────────────────────────────

    /** Admin: list all appointments in the system */
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointments() {
        return ResponseEntity.ok(appointmentService.getAllAppointments());
    }

    /** Admin: delete any appointment by ID */
    @DeleteMapping("/appointments/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Long id) {
        appointmentService.deleteAppointment(id);
        return ResponseEntity.noContent().build();
    }

    /** Admin: cancel any appointment by ID — sends email to patient */
    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<AppointmentResponseDto> cancelAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) CancelAppointmentRequestDto requestDto) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, "ADMIN", requestDto));
    }

    // ── Stats ─────────────────────────────────────────────────────────────────

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getStats() {
        return ResponseEntity.ok(Map.of(
                "totalPatients",     patientRepository.count(),
                "totalDoctors",      doctorRepository.count(),
                "totalAppointments", appointmentRepository.count()
        ));
    }
}
