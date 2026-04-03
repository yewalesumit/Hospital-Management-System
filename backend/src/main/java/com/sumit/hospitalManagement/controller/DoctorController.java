package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.AppointmentResponseDto;
import com.sumit.hospitalManagement.dto.CancelAppointmentRequestDto;
import com.sumit.hospitalManagement.dto.PatientDetailResponseDto;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.service.AppointmentService;
import com.sumit.hospitalManagement.service.PatientService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/doctors")
@RequiredArgsConstructor
public class DoctorController {

    private final AppointmentService appointmentService;
    private final PatientService patientService;

    @GetMapping("/appointments")
    public ResponseEntity<List<AppointmentResponseDto>> getAllAppointmentsOfDoctor() {

        User user = (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return ResponseEntity.ok(appointmentService.getAllAppointmentsOfDoctor(user.getId()));
    }

    /**
     * PATCH /doctors/appointments/{id}/cancel
     * Allows a doctor to cancel one of their own appointments.
     * Sends a cancellation email to the patient automatically.
     */
    @PatchMapping("/appointments/{id}/cancel")
    public ResponseEntity<AppointmentResponseDto> cancelAppointment(
            @PathVariable Long id,
            @RequestBody(required = false) CancelAppointmentRequestDto requestDto) {
        return ResponseEntity.ok(appointmentService.cancelAppointment(id, "DOCTOR", requestDto));
    }

    /**
     * GET /doctors/patients/{id}
     * Allows a doctor to view full details of a patient (including their appointment history).
     */
    @GetMapping("/patients/{id}")
    public ResponseEntity<PatientDetailResponseDto> getPatientDetail(@PathVariable Long id) {
        return ResponseEntity.ok(patientService.getPatientDetail(id));
    }
}
