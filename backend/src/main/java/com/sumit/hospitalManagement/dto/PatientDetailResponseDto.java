package com.sumit.hospitalManagement.dto;

import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class PatientDetailResponseDto {

    private Long id;
    private String name;
    private String email;
    private String gender;
    private LocalDate birthDate;
    private BloodGroupType bloodGroup;

    // Insurance info
    private String insurancePolicyNumber;
    private String insuranceProvider;
    private LocalDate insuranceValidUntil;

    // Appointment history
    private List<AppointmentResponseDto> appointments;
}

