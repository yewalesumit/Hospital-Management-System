package com.sumit.hospitalManagement.repository;

import com.sumit.hospitalManagement.entity.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByDoctorId(Long doctorId);

    List<Appointment> findByPatientId(Long patientId);

    /** Used by AI access control: checks whether a doctor has ever had an appointment with a patient. */
    boolean existsByDoctorIdAndPatientId(Long doctorId, Long patientId);

    /** Null-out the doctor FK on all appointments belonging to this doctor (used before doctor deletion). */
    @Modifying
    @Query("UPDATE Appointment a SET a.doctor = null WHERE a.doctor.id = :doctorId")
    void nullifyDoctorOnAppointments(@Param("doctorId") Long doctorId);
}

