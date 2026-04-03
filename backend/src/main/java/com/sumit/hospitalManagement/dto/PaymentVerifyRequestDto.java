package com.sumit.hospitalManagement.dto;

import lombok.Data;
import java.time.LocalDateTime;

/** Sent AFTER patient fills the payment form — triggers signature verify + appointment create */
@Data
public class PaymentVerifyRequestDto {
    private String orderId;
    private String paymentId;
    private String signature;         // HMAC-SHA256(secret, orderId + "|" + paymentId)

    private Long patientId;
    private Long doctorId;
    private LocalDateTime appointmentTime;
    private String reason;
}

