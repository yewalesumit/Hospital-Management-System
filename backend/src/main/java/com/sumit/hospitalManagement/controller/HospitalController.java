package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.DoctorResponseDto;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import com.sumit.hospitalManagement.repository.DoctorRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import com.sumit.hospitalManagement.service.DoctorService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/public")
@RequiredArgsConstructor
public class HospitalController {

    private final DoctorService        doctorService;
    private final PatientRepository    patientRepository;
    private final DoctorRepository     doctorRepository;
    private final AppointmentRepository appointmentRepository;

    @GetMapping("/doctors")
    public ResponseEntity<List<DoctorResponseDto>> getAllDoctors() {
        return ResponseEntity.ok(doctorService.getAllDoctor());
    }

    /**
     * GET /public/stats
     * Returns real counts for landing page — no auth required.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Long>> getPublicStats() {
        return ResponseEntity.ok(Map.of(
                "totalPatients",     patientRepository.count(),
                "totalDoctors",      doctorRepository.count(),
                "totalAppointments", appointmentRepository.count()
        ));
    }
}

