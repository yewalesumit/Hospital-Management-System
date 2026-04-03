package com.sumit.hospitalManagement.dto;

import lombok.Data;

import java.time.LocalDate;

@Data
public class InsuranceRequestDto {
    private String provider;
    private String policyNumber;
    private LocalDate validUntil;
}
