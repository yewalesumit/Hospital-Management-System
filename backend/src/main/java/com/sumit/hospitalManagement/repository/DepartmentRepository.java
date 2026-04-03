package com.sumit.hospitalManagement.repository;

import com.sumit.hospitalManagement.entity.Department;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    /** Find all departments where this doctor is the head (used before doctor deletion). */
    @Query("SELECT d FROM Department d WHERE d.headDoctor.id = :doctorId")
    List<Department> findByHeadDoctorId(@Param("doctorId") Long doctorId);

    /** Null-out headDoctor on all departments that reference this doctor. */
    @Modifying
    @Query("UPDATE Department d SET d.headDoctor = null WHERE d.headDoctor.id = :doctorId")
    void nullifyHeadDoctor(@Param("doctorId") Long doctorId);
}