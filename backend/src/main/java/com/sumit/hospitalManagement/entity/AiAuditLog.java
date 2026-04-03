package com.sumit.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

/**
 * Persists an audit record for every AI call — both allowed and denied.
 *
 * PHI minimisation:
 *   - answer_hash stores SHA-256(answer) only — raw LLM answer is NEVER stored.
 *   - patient_id stores a numeric reference only — no PHI fields are copied.
 *
 * Table is auto-created by spring.jpa.hibernate.ddl-auto=update (application.properties L8).
 */
@Entity
@Table(name = "ai_audit_log")
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** UUID — one per HTTP request, returned in AiResponse.requestId */
    @Column(nullable = false, length = 36)
    private String requestId;

    /** Email of the authenticated caller; null for public FAQ. */
    @Column(length = 255)
    private String callerEmail;

    /** Role: ADMIN / DOCTOR / PATIENT / PUBLIC */
    @Column(nullable = false, length = 20)
    private String callerRole;

    /** Numeric patient PK; null for FAQ requests. */
    @Column
    private Long patientId;

    /** SUMMARY / QA / FAQ */
    @Column(nullable = false, length = 20)
    private String requestType;

    /** The user's question or prompt. */
    @Column(columnDefinition = "TEXT")
    private String question;

    /** SHA-256 hex of the LLM answer, or "DENIED-<hash>" for denied calls. */
    @Column(nullable = false, length = 80)
    private String answerHash;

    /** true = LLM was called; false = denied before reaching LLM. */
    @Column(nullable = false)
    private boolean allowed;

    /** Populated only when allowed = false. */
    @Column(length = 500)
    private String denyReason;

    /** e.g. "ollama/llama3.1:8b-instruct" */
    @Column(nullable = false, length = 150)
    private String modelUsed;

    /** Milliseconds from start of request to LLM response. 0 for denied calls. */
    @Column(nullable = false)
    private long latencyMs;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}

