package com.sumit.hospitalManagement.service;

import com.sumit.hospitalManagement.dto.AppointmentResponseDto;
import com.sumit.hospitalManagement.dto.CancelAppointmentRequestDto;
import com.sumit.hospitalManagement.dto.CreateAppointmentRequestDto;
import com.sumit.hospitalManagement.entity.Appointment;
import com.sumit.hospitalManagement.entity.Doctor;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.entity.type.AppointmentStatus;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import com.sumit.hospitalManagement.repository.DoctorRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.security.access.annotation.Secured;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AppointmentService {

    private final PatientRepository patientRepository;
    private final DoctorRepository doctorRepository;
    private final AppointmentRepository appointmentRepository;
    private final ModelMapper modelMapper;
    private final EmailService emailService;

    @Transactional
    @Secured("ROLE_PATIENT")
    public AppointmentResponseDto createNewAppointment(CreateAppointmentRequestDto createAppointmentRequestDto) {
        Long doctorId = createAppointmentRequestDto.getDoctorId();
        Long patientId = createAppointmentRequestDto.getPatientId();

        Patient patient = patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + doctorId));
        Appointment appointment = Appointment.builder()
                .reason(createAppointmentRequestDto.getReason())
                .appointmentTime(createAppointmentRequestDto.getAppointmentTime())
                .build();

        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        patient.getAppointments().add(appointment); // to maintain consistency

        appointment = appointmentRepository.save(appointment);
        return toDto(appointment);
    }

    @Transactional
    public Appointment reAssignAppointmentToAnotherDoctor(Long appointmentId , Long doctorId){

        Appointment appointment =  appointmentRepository.findById(appointmentId).orElseThrow();
        Doctor doctor = doctorRepository.findById(doctorId).orElseThrow();

        appointment.setDoctor(doctor);

        doctor.getAppointments().add(appointment);

        return appointment;
    }

    public List<AppointmentResponseDto> getAllAppointmentsOfDoctor(Long doctorId) {
        doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + doctorId));

        return appointmentRepository.findByDoctorId(doctorId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDto> getAllAppointmentsOfPatient(Long patientId) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with ID: " + patientId));

        return appointmentRepository.findByPatientId(patientId)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Admin: get ALL appointments across the system */
    public List<AppointmentResponseDto> getAllAppointments() {
        return appointmentRepository.findAll()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    /** Admin: hard-delete any appointment by ID */
    @Transactional
    public void deleteAppointment(Long appointmentId) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with ID: " + appointmentId));
        // detach from patient list to keep consistency
        if (appointment.getPatient() != null) {
            appointment.getPatient().getAppointments().remove(appointment);
        }
        appointmentRepository.deleteById(appointmentId);
    }

    /**
     * Cancel an appointment (Doctor or Admin).
     * Marks it CANCELLED, records who cancelled it, and sends a notification email to the patient.
     *
     * @param appointmentId  ID of the appointment to cancel
     * @param cancelledBy    "DOCTOR" or "ADMIN"
     * @param requestDto     optional cancellation reason
     */
    @Transactional
    public AppointmentResponseDto cancelAppointment(Long appointmentId,
                                                    String cancelledBy,
                                                    CancelAppointmentRequestDto requestDto) {
        Appointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new EntityNotFoundException("Appointment not found with ID: " + appointmentId));

        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalStateException("Appointment #" + appointmentId + " is already cancelled.");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        appointment.setCancelledBy(cancelledBy);
        if (requestDto != null && requestDto.getCancellationReason() != null) {
            appointment.setCancellationReason(requestDto.getCancellationReason());
        }

        appointment = appointmentRepository.save(appointment);

        // Send cancellation email to patient asynchronously
        Patient patient = appointment.getPatient();
        Doctor  doctor  = appointment.getDoctor();
        if (patient != null && patient.getEmail() != null) {
            emailService.sendCancellationEmail(
                    patient.getEmail(),
                    patient.getName(),
                    doctor != null ? doctor.getName() : "N/A",
                    appointment.getAppointmentTime(),
                    appointment.getReason(),
                    cancelledBy,
                    appointment.getCancellationReason()
            );
        }

        return toDto(appointment);
    }

    /** Maps Appointment → AppointmentResponseDto and fills patientName / patientId. */
    private AppointmentResponseDto toDto(Appointment appointment) {
        AppointmentResponseDto dto = modelMapper.map(appointment, AppointmentResponseDto.class);
        if (appointment.getPatient() != null) {
            dto.setPatientId(appointment.getPatient().getId());
            dto.setPatientName(appointment.getPatient().getName());
        }
        // Map enum status to string
        if (appointment.getStatus() != null) {
            dto.setStatus(appointment.getStatus().name());
        }
        dto.setCancelledBy(appointment.getCancelledBy());
        dto.setCancellationReason(appointment.getCancellationReason());
        return dto;
    }


}

