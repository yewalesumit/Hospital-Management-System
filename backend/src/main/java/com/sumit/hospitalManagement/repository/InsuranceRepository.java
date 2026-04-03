package com.sumit.hospitalManagement.repository;

import com.sumit.hospitalManagement.entity.Insurance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface InsuranceRepository extends JpaRepository<Insurance, Long> {



}