package com.sumit.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/** Returned to frontend — used to open the payment modal */
@Data @AllArgsConstructor @NoArgsConstructor
public class PaymentOrderResponseDto {
    private String orderId;        // e.g. "HMS_order_abc123"
    private Integer amount;        // paise
    private String currency;       // "INR"
    private String keyId;         // Razorpay key_id — needed by frontend to open checkout
    private String patientName;
    private String patientEmail;
}
