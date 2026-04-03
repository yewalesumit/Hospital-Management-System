package com.sumit.hospitalManagement.dto;

import lombok.Data;

@Data
public class CancelAppointmentRequestDto {
    /** Optional note explaining why the appointment was cancelled */
    private String cancellationReason;
}

