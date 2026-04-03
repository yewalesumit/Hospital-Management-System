package com.sumit.hospitalManagement.dto;

import lombok.Data;
import java.time.LocalDateTime;

/** Sent by the patient BEFORE the payment modal opens */
@Data
public class CreatePaymentOrderRequestDto {
    private Long patientId;
    private Long doctorId;
    private LocalDateTime appointmentTime;
    private String reason;
}

