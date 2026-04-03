package com.sumit.hospitalManagement.service;

import com.sumit.hospitalManagement.dto.InsuranceRequestDto;
import com.sumit.hospitalManagement.dto.InsuranceResponseDto;
import com.sumit.hospitalManagement.entity.Insurance;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.repository.InsuranceRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class InsuranceService {

    private final PatientRepository patientRepository;
    private final InsuranceRepository insuranceRepository;

    /** GET current insurance — returns null if none */
    public InsuranceResponseDto getInsurance(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found: " + patientId));
        if (patient.getInsurance() == null) return null;
        return toDto(patient.getInsurance());
    }

    /** Add or replace insurance (orphanRemoval deletes the old row) */
    @Transactional
    public InsuranceResponseDto saveInsurance(Long patientId, InsuranceRequestDto req) {
        // Manual validation
        if (req.getProvider() == null || req.getProvider().isBlank())
            throw new IllegalArgumentException("Provider name is required");
        if (req.getPolicyNumber() == null || req.getPolicyNumber().isBlank())
            throw new IllegalArgumentException("Policy number is required");
        if (req.getValidUntil() == null)
            throw new IllegalArgumentException("Valid until date is required");
        if (!req.getValidUntil().isAfter(java.time.LocalDate.now()))
            throw new IllegalArgumentException("Valid until date must be in the future");

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found: " + patientId));

        Insurance insurance = Insurance.builder()
                .provider(req.getProvider().trim())
                .policyNumber(req.getPolicyNumber().trim())
                .validUntil(req.getValidUntil())
                .build();

        patient.setInsurance(insurance);
        Patient saved = patientRepository.save(patient);
        return toDto(saved.getInsurance());
    }

    /** Delete insurance */
    @Transactional
    public void deleteInsurance(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found: " + patientId));
        if (patient.getInsurance() == null)
            throw new EntityNotFoundException("No insurance found for patient: " + patientId);
        patient.setInsurance(null);
        patientRepository.save(patient);
    }

    // ── Legacy helpers (kept for any existing callers) ────────────────────────
    @Transactional
    public Patient assignInsuranceToPatient(Insurance insurance, Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found: " + patientId));
        patient.setInsurance(insurance);
        insurance.setPatient(patient);
        return patient;
    }

    @Transactional
    public Patient disaccociateInsuranceFromPatient(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new IllegalArgumentException("Patient not found: " + patientId));
        patient.setInsurance(null);
        return patient;
    }

    private InsuranceResponseDto toDto(Insurance ins) {
        InsuranceResponseDto dto = new InsuranceResponseDto();
        dto.setId(ins.getId());
        dto.setProvider(ins.getProvider());
        dto.setPolicyNumber(ins.getPolicyNumber());
        dto.setValidUntil(ins.getValidUntil());
        dto.setCreatedAt(ins.getCreatedAt());
        return dto;
    }
}
