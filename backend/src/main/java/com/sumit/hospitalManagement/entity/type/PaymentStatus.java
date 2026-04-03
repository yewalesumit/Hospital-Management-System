package com.sumit.hospitalManagement.entity.type;

public enum PaymentStatus {
    PENDING,   // Order created, awaiting payment
    PAID,      // Payment verified successfully
    FAILED     // Verification failed
}

