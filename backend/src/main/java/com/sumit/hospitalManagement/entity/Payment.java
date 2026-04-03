package com.sumit.hospitalManagement.entity;

import com.sumit.hospitalManagement.entity.type.PaymentStatus;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Getter @Setter @Builder @AllArgsConstructor @NoArgsConstructor
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Unique order token created by our backend */
    @Column(nullable = false, unique = true)
    private String orderId;

    /** Payment ID produced by the frontend after successful mock payment */
    @Column
    private String paymentId;

    /** HMAC-SHA256 signature — verified server-side */
    @Column
    private String signature;

    /** Amount in paise (e.g. 50000 = ₹500) */
    @Column(nullable = false)
    private Integer amount;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PaymentStatus status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    /** Set once the appointment is confirmed */
    @OneToOne(mappedBy = "payment")
    private Appointment appointment;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}

