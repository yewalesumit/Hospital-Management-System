package com.sumit.hospitalManagement.entity;

import com.sumit.hospitalManagement.entity.type.AppointmentStatus;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;


@Entity
@Setter
@Getter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue( strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDateTime appointmentTime;

    @Column(length = 500)
    private String reason;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private AppointmentStatus status = AppointmentStatus.SCHEDULED;

    /** Who cancelled this appointment: "DOCTOR", "ADMIN", or null */
    @Column(length = 20)
    private String cancelledBy;

    /** Optional cancellation reason / note */
    @Column(length = 500)
    private String cancellationReason;

    @ManyToOne
    @ToString.Exclude
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.EAGER)
    @ToString.Exclude
    @JoinColumn(nullable = true)
    private Doctor doctor;

    /** Payment linked to this appointment */
    @OneToOne(fetch = FetchType.LAZY)
    @ToString.Exclude
    @JoinColumn(name = "payment_id")
    private Payment payment;
}
