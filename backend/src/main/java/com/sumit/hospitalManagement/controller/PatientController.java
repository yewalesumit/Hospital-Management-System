package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.AppointmentResponseDto;
import com.sumit.hospitalManagement.dto.CreateAppointmentRequestDto;
import com.sumit.hospitalManagement.dto.InsuranceRequestDto;
import com.sumit.hospitalManagement.dto.InsuranceResponseDto;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.repository.PatientRepository;
import com.sumit.hospitalManagement.service.AppointmentService;
import com.sumit.hospitalManagement.service.InsuranceService;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/patients")
@RequiredArgsConstructor
public class PatientController {

    private final AppointmentService appointmentService;
    private final ModelMapper modelMapper;
    private final PatientRepository patientRepository;
    private final InsuranceService insuranceService;

    // ── Appointments ──────────────────────────────────────────────────────────

    @PostMapping("/appointments")
    public ResponseEntity<AppointmentResponseDto> createNewAppointment(
            @RequestBody CreateAppointmentRequestDto createAppointmentRequestDto) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(appointmentService.createNewAppointment(createAppointmentRequestDto));
    }

    /**
     * GET /patients/appointments
     * Returns all appointments for the currently logged-in patient.
     * The patient's userId is used to look up their patient record.
     */
    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getMyAppointments() {
        User user = currentUser();
        return ResponseEntity.ok(appointmentService.getAllAppointmentsOfPatient(user.getId()));
    }

    // ── Insurance ─────────────────────────────────────────────────────────────

    /**
     * GET /patients/insurance
     * Returns current patient's insurance, or 204 No Content if not set.
     */
    @GetMapping("/insurance")
    public ResponseEntity<InsuranceResponseDto> getMyInsurance() {
        User user = currentUser();
        InsuranceResponseDto dto = insuranceService.getInsurance(user.getId());
        if (dto == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(dto);
    }

    /**
     * POST /patients/insurance
     * Add or replace insurance. Returns 200 with updated insurance.
     */
    @PostMapping("/insurance")
    public ResponseEntity<InsuranceResponseDto> saveMyInsurance(
            @RequestBody InsuranceRequestDto req) {
        User user = currentUser();
        InsuranceResponseDto dto = insuranceService.saveInsurance(user.getId(), req);
        return ResponseEntity.ok(dto);
    }

    /**
     * DELETE /patients/insurance
     * Remove patient's insurance record.
     */
    @DeleteMapping("/insurance")
    public ResponseEntity<Void> deleteMyInsurance() {
        User user = currentUser();
        insuranceService.deleteInsurance(user.getId());
        return ResponseEntity.noContent().build();
    }

    // ── Helper ────────────────────────────────────────────────────────────────

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
