package com.sumit.hospitalManagement.dto;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class InsuranceResponseDto {
    private Long id;
    private String provider;
    private String policyNumber;
    private LocalDate validUntil;
    private LocalDateTime createdAt;
}

