package com.sumit.hospitalManagement.repository;

import com.sumit.hospitalManagement.entity.AiAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AiAuditLogRepository extends JpaRepository<AiAuditLog, Long> {

    List<AiAuditLog> findByCallerEmail(String callerEmail);

    List<AiAuditLog> findByPatientId(Long patientId);

    List<AiAuditLog> findByAllowed(boolean allowed);

    List<AiAuditLog> findByRequestType(String requestType);
}

