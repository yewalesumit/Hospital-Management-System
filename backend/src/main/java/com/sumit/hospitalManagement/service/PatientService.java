package com.sumit.hospitalManagement.service;

import com.sumit.hospitalManagement.dto.AppointmentResponseDto;
import com.sumit.hospitalManagement.dto.PatientDetailResponseDto;
import com.sumit.hospitalManagement.dto.PatientResponseDto;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepository;
    private final AppointmentRepository appointmentRepository;
    private final ModelMapper modelMapper;

    @Transactional
    public Patient getPatientById(Long id) {
        return patientRepository.findById(id).orElse(null);
    }

    public List<PatientResponseDto> getAllPatients(Integer pageNumber, Integer pageSize) {
        return patientRepository.findAllPatient(PageRequest.of(pageNumber, pageSize))
                .stream()
                .map(patient -> modelMapper.map(patient, PatientResponseDto.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public PatientDetailResponseDto getPatientDetail(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));

        PatientDetailResponseDto dto = new PatientDetailResponseDto();
        dto.setId(patient.getId());
        dto.setName(patient.getName());
        dto.setEmail(patient.getEmail());
        dto.setGender(patient.getGender());
        dto.setBirthDate(patient.getBirthDate());
        dto.setBloodGroup(patient.getBloodGroup());

        // Map insurance fields if present
        if (patient.getInsurance() != null) {
            dto.setInsurancePolicyNumber(patient.getInsurance().getPolicyNumber());
            dto.setInsuranceProvider(patient.getInsurance().getProvider());
            dto.setInsuranceValidUntil(patient.getInsurance().getValidUntil());
        }

        // Load appointments for this patient
        List<AppointmentResponseDto> appointments = appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(a -> {
                    AppointmentResponseDto aDto = modelMapper.map(a, AppointmentResponseDto.class);
                    aDto.setPatientId(patient.getId());
                    aDto.setPatientName(patient.getName());
                    // Explicitly set status — ModelMapper cannot auto-convert enum → String
                    if (a.getStatus() != null) {
                        aDto.setStatus(a.getStatus().name());
                    }
                    aDto.setCancelledBy(a.getCancelledBy());
                    aDto.setCancellationReason(a.getCancellationReason());
                    return aDto;
                })
                .collect(Collectors.toList());
        dto.setAppointments(appointments);

        return dto;
    }
}
