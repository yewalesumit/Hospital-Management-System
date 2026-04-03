package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.*;
import com.sumit.hospitalManagement.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/patients/payment")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    /**
     * GET /patients/payment/config
     * Returns Razorpay key_id + fee for frontend checkout.
     */
    @GetMapping("/config")
    public ResponseEntity<Map<String, Object>> getConfig() {
        return ResponseEntity.ok(Map.of(
                "keyId",    paymentService.getKeyId(),
                "fee",      paymentService.getFee(),
                "currency", "INR"
        ));
    }

    /**
     * POST /patients/payment/create-order
     * Creates a Razorpay order and returns orderId + keyId.
     */
    @PostMapping("/create-order")
    public ResponseEntity<PaymentOrderResponseDto> createOrder(
            @RequestBody CreatePaymentOrderRequestDto request) {
        return ResponseEntity.ok(paymentService.createOrder(request));
    }

    /**
     * POST /patients/payment/verify
     * Verifies Razorpay signature and creates appointment.
     */
    @PostMapping("/verify")
    public ResponseEntity<AppointmentResponseDto> verify(
            @RequestBody PaymentVerifyRequestDto request) {
        return ResponseEntity.ok(paymentService.verifyAndBook(request));
    }
}
