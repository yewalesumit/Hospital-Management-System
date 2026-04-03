package com.sumit.hospitalManagement.ai;

import com.sumit.hospitalManagement.entity.AiAuditLog;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.repository.AiAuditLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * Persists an AiAuditLog row for every AI call (both allowed and denied).
 *
 * PHI rule: raw LLM answers are NEVER stored — only SHA-256(answer) is persisted.
 * Writes are @Async so they do not add to the HTTP response latency.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiAuditLogger {

    private final AiAuditLogRepository repo;

    /**
     * Log a successful (allowed) AI call.
     *
     * @param caller      authenticated user (null for public FAQ)
     * @param patientId   patient queried (null for FAQ)
     * @param requestType "SUMMARY" | "QA" | "FAQ"
     * @param question    user's input text
     * @param answer      raw LLM answer — only its hash is stored
     * @param provider    e.g. "ollama"
     * @param model       e.g. "llama3.1:8b-instruct"
     * @param requestId   UUID from AiResponse
     * @param latencyMs   time from request start to LLM response
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logAllowed(User caller, Long patientId, String requestType,
                           String question, String answer,
                           String provider, String model,
                           String requestId, long latencyMs) {
        try {
            AiAuditLog log = AiAuditLog.builder()
                    .requestId(requestId)
                    .callerEmail(caller != null ? caller.getUsername() : null)
                    .callerRole(resolveRole(caller))
                    .patientId(patientId)
                    .requestType(requestType)
                    .question(question)
                    .answerHash(sha256(answer))
                    .allowed(true)
                    .denyReason(null)
                    .modelUsed(provider + "/" + model)
                    .latencyMs(latencyMs)
                    .build();
            repo.save(log);
        } catch (Exception e) {
            this.log.error("AiAuditLogger.logAllowed failed: {}", e.getMessage());
        }
    }

    /**
     * Log a denied AI call (access-control check failed).
     * LLM is NOT called in this path.
     */
    @Async
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void logDenied(User caller, Long patientId, String requestType,
                          String question, String denyReason,
                          String provider, String model,
                          String requestId) {
        try {
            AiAuditLog entry = AiAuditLog.builder()
                    .requestId(requestId)
                    .callerEmail(caller != null ? caller.getUsername() : null)
                    .callerRole(resolveRole(caller))
                    .patientId(patientId)
                    .requestType(requestType)
                    .question(question)
                    .answerHash("DENIED-" + sha256(denyReason))
                    .allowed(false)
                    .denyReason(denyReason)
                    .modelUsed(provider + "/" + model)
                    .latencyMs(0L)
                    .build();
            repo.save(entry);
        } catch (Exception e) {
            log.error("AiAuditLogger.logDenied failed: {}", e.getMessage());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static String resolveRole(User caller) {
        if (caller == null || caller.getRoles() == null || caller.getRoles().isEmpty()) {
            return "PUBLIC";
        }
        return caller.getRoles().iterator().next().name();
    }

    public static String sha256(String text) {
        if (text == null) text = "";
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] bytes = md.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder(64);
            for (byte b : bytes) hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (NoSuchAlgorithmException e) {
            return "hash-error";
        }
    }
}

