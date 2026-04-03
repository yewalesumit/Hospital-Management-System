package com.sumit.hospitalManagement.service;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.sumit.hospitalManagement.dto.*;
import com.sumit.hospitalManagement.entity.*;
import com.sumit.hospitalManagement.entity.type.PaymentStatus;
import com.sumit.hospitalManagement.repository.*;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class PaymentService {

    private final PaymentRepository     paymentRepository;
    private final PatientRepository     patientRepository;
    private final DoctorRepository      doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final RazorpayClient        razorpayClient;
    private final String                razorpayKeyId;
    private final String                razorpayKeySecret;
    private final Integer               consultationFee;

    public PaymentService(
            PaymentRepository paymentRepository,
            PatientRepository patientRepository,
            DoctorRepository doctorRepository,
            AppointmentRepository appointmentRepository,
            @Value("${razorpay.key_id}") String keyId,
            @Value("${razorpay.key_secret}") String keySecret,
            @Value("${payment.fee}") Integer fee) {
        this.paymentRepository  = paymentRepository;
        this.patientRepository  = patientRepository;
        this.doctorRepository   = doctorRepository;
        this.appointmentRepository = appointmentRepository;
        this.razorpayKeyId      = keyId;
        this.razorpayKeySecret  = keySecret;
        this.consultationFee    = fee;
        try {
            this.razorpayClient = new RazorpayClient(keyId, keySecret);
            log.info("RazorpayClient initialized with key: {}", keyId);
        } catch (RazorpayException e) {
            throw new IllegalStateException("Failed to initialize Razorpay client: " + e.getMessage(), e);
        }
    }

    // ── Step 1: Create Razorpay Order ─────────────────────────────────────────
    @Transactional
    public PaymentOrderResponseDto createOrder(CreatePaymentOrderRequestDto req) {
        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient not found: " + req.getPatientId()));
        doctorRepository.findById(req.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found: " + req.getDoctorId()));

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount",          consultationFee);  // paise
            orderRequest.put("currency",        "INR");
            orderRequest.put("receipt",         "rcpt_" + patient.getId() + "_" + System.currentTimeMillis());
            orderRequest.put("payment_capture", 1);

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String orderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                    .orderId(orderId)
                    .amount(consultationFee)
                    .status(PaymentStatus.PENDING)
                    .patient(patient)
                    .build();
            paymentRepository.save(payment);

            log.info("Razorpay order created [{}] ₹{} for patient #{}", orderId, consultationFee / 100, patient.getId());

            return new PaymentOrderResponseDto(
                    orderId, consultationFee, "INR",
                    razorpayKeyId, patient.getName(), patient.getEmail()
            );
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed: {}", e.getMessage());
            throw new RuntimeException("Failed to create payment order: " + e.getMessage());
        }
    }

    // ── Step 2: Verify Razorpay signature + create appointment ───────────────
    @Transactional
    public AppointmentResponseDto verifyAndBook(PaymentVerifyRequestDto req) {
        // Correct API: Utils.verifySignature(payload, signature, secret)
        // payload = orderId + "|" + paymentId
        String payload = req.getOrderId() + "|" + req.getPaymentId();
        try {
            boolean valid = Utils.verifySignature(payload, req.getSignature(), razorpayKeySecret);
            if (!valid) {
                paymentRepository.findByOrderId(req.getOrderId())
                        .ifPresent(p -> { p.setStatus(PaymentStatus.FAILED); paymentRepository.save(p); });
                throw new SecurityException("Razorpay payment signature verification failed");
            }
        } catch (RazorpayException e) {
            throw new SecurityException("Signature verification error: " + e.getMessage());
        }

        Payment payment = paymentRepository.findByOrderId(req.getOrderId())
                .orElseThrow(() -> new EntityNotFoundException("Payment order not found: " + req.getOrderId()));
        payment.setPaymentId(req.getPaymentId());
        payment.setSignature(req.getSignature());
        payment.setStatus(PaymentStatus.PAID);
        paymentRepository.save(payment);

        Patient patient = patientRepository.findById(req.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient not found"));
        Doctor doctor = doctorRepository.findById(req.getDoctorId())
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found"));

        Appointment appointment = Appointment.builder()
                .reason(req.getReason())
                .appointmentTime(req.getAppointmentTime())
                .patient(patient)
                .doctor(doctor)
                .payment(payment)
                .build();
        patient.getAppointments().add(appointment);
        appointment = appointmentRepository.save(appointment);

        payment.setAppointment(appointment);
        paymentRepository.save(payment);

        log.info("Razorpay payment [{}] verified → appointment #{} created", req.getPaymentId(), appointment.getId());

        DoctorResponseDto doctorDto = new DoctorResponseDto();
        doctorDto.setId(doctor.getId());
        doctorDto.setName(doctor.getName());
        doctorDto.setSpecialization(doctor.getSpecialization());
        doctorDto.setEmail(doctor.getEmail());

        AppointmentResponseDto dto = new AppointmentResponseDto();
        dto.setId(appointment.getId());
        dto.setAppointmentTime(appointment.getAppointmentTime());
        dto.setReason(appointment.getReason());
        dto.setPatientId(patient.getId());
        dto.setPatientName(patient.getName());
        dto.setStatus("SCHEDULED");
        dto.setDoctor(doctorDto);
        return dto;
    }

    public String getKeyId()     { return razorpayKeyId; }
    public String getKeySecret() { return razorpayKeySecret; }
    public Integer getFee()      { return consultationFee; }
}
