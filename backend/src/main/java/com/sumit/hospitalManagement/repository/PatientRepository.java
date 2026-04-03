package com.sumit.hospitalManagement.repository;

import com.sumit.hospitalManagement.dto.BloodGroupCountResponseEntity;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import jakarta.transaction.Transactional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;


import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface PatientRepository extends JpaRepository <Patient, Long>{


    List<Patient> findByName(String name);

    Patient findByEmail(String email);

    List<Patient> findByBirthDateOrEmail(LocalDate birthDate, String email);

    // Custom Query in JPQL
    @Query("select p from Patient p where p.bloodGroup = ?1")
    List<Patient> findByBloodGroup(@Param("bloodGroup") BloodGroupType bloodGroup);

    @Query("select p from Patient p where p.birthDate > :birthDate")
    List<Patient> findByBornAfterDate(@Param("birthDate") LocalDate birthDate);

    @Query("select new com.sumit.hospitalManagement.dto.BloodGroupCountResponseEntity(p.bloodGroup," +
            " Count(p)) from Patient p group by p.bloodGroup")
    List<BloodGroupCountResponseEntity> countEachBloodGroupType();

    @Query(value = "select * from patient",nativeQuery = true)
    Page<Patient> findAllPatient(Pageable pageable);

    @Transactional
    @Modifying
    @Query("update Patient p set p.name = :name where p.id = :id ")
    int updateNameWithId(@Param("name") String name, @Param("id") Long id);

//    @Query(" select p from Patient p LEFT JOIN fetch p.appointments a LEFT JOIN fetch a.doctor")
    @Query(" select p from Patient p LEFT JOIN fetch p.appointments")
    List<Patient> findAllPatientWithAppointment();



}