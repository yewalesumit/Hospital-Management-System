package com.sumit.hospitalManagement.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentResponseDto {

    private Long id;
    private LocalDateTime appointmentTime;
    private String reason;
    private DoctorResponseDto doctor;

    // Patient info — populated manually in services (ModelMapper won't map nested entity to flat fields)
    private Long patientId;
    private String patientName;

    // Appointment status: SCHEDULED, COMPLETED, CANCELLED
    private String status;

    // Who cancelled: "DOCTOR" or "ADMIN" (null if not cancelled)
    private String cancelledBy;

    // Cancellation reason / note
    private String cancellationReason;
}
