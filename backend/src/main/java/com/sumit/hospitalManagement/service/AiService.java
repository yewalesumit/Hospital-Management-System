package com.sumit.hospitalManagement.service;

import com.sumit.hospitalManagement.ai.*;
import com.sumit.hospitalManagement.dto.*;
import com.sumit.hospitalManagement.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Orchestrates every AI request in this fixed order:
 *
 *  1. Generate a unique requestId (UUID).
 *  2. AiAccessControl.check() — DENY immediately + audit if not allowed.
 *  3. PatientContextBuilder.build() — fetch patient data from DB (skipped for FAQ).
 *  4. PromptTemplates — inject context into system prompt.
 *  5. LlmProvider.complete() — call Ollama (or mock) and measure latency.
 *  6. AiAuditLogger.logAllowed() — persist audit row asynchronously.
 *  7. Return AiResponse to caller.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiService {

    private final LlmProvider          llmProvider;
    private final AiAccessControl      accessControl;
    private final PatientContextBuilder contextBuilder;
    private final AiAuditLogger         auditLogger;

    // ── POST /ai/summary ─────────────────────────────────────────────────────

    public AiResponse summary(AiSummaryRequest req, User caller) {
        String requestId = UUID.randomUUID().toString();

        // 1. Access control
        AiAccessControl.Decision decision = accessControl.check(caller, req.getPatientId());
        if (!decision.allowed()) {
            auditLogger.logDenied(caller, req.getPatientId(), "SUMMARY",
                    "summary request", decision.reason(),
                    llmProvider.getProviderName(), llmProvider.getModelName(), requestId);
            throw new AccessDeniedException(decision.reason());
        }

        // 2. Build context
        String context = contextBuilder.build(req.getPatientId());

        // 3. Fill prompt
        String systemPrompt = PromptTemplates.withContext(PromptTemplates.SUMMARY_SYSTEM, context);
        String userMessage  = PromptTemplates.SUMMARY_USER;

        // 4. Call LLM + measure latency
        long start  = System.currentTimeMillis();
        String answer = llmProvider.complete(systemPrompt, userMessage);
        long latency = System.currentTimeMillis() - start;

        // 5. Audit
        auditLogger.logAllowed(caller, req.getPatientId(), "SUMMARY",
                userMessage, answer,
                llmProvider.getProviderName(), llmProvider.getModelName(),
                requestId, latency);

        return buildResponse(answer, "SUMMARY", requestId, latency);
    }

    // ── POST /ai/qa ──────────────────────────────────────────────────────────

    public AiResponse qa(AiQaRequest req, User caller) {
        String requestId = UUID.randomUUID().toString();

        // 1. Access control
        AiAccessControl.Decision decision = accessControl.check(caller, req.getPatientId());
        if (!decision.allowed()) {
            auditLogger.logDenied(caller, req.getPatientId(), "QA",
                    req.getQuestion(), decision.reason(),
                    llmProvider.getProviderName(), llmProvider.getModelName(), requestId);
            throw new AccessDeniedException(decision.reason());
        }

        // 2. Build context
        String context = contextBuilder.build(req.getPatientId());

        // 3. Fill prompt
        String systemPrompt = PromptTemplates.withContext(PromptTemplates.QA_SYSTEM, context);

        // 4. Call LLM + measure latency
        long start  = System.currentTimeMillis();
        String answer = llmProvider.complete(systemPrompt, req.getQuestion());
        long latency = System.currentTimeMillis() - start;

        // 5. Audit
        auditLogger.logAllowed(caller, req.getPatientId(), "QA",
                req.getQuestion(), answer,
                llmProvider.getProviderName(), llmProvider.getModelName(),
                requestId, latency);

        return buildResponse(answer, "QA", requestId, latency);
    }

    // ── POST /ai/faq ─────────────────────────────────────────────────────────

    /**
     * FAQ is PUBLIC — no caller identity required, no patient data accessed.
     * Access control is still checked (patientId=null always returns ALLOW).
     */
    public AiResponse faq(AiFaqRequest req) {
        String requestId = UUID.randomUUID().toString();

        // FAQ: no patient data — patientId = null, caller = null
        // Context builder is NOT called at all.
        String systemPrompt = PromptTemplates.withFaq(PromptTemplates.FAQ_SYSTEM);

        long start  = System.currentTimeMillis();
        String answer = llmProvider.complete(systemPrompt, req.getQuestion());
        long latency = System.currentTimeMillis() - start;

        auditLogger.logAllowed(null, null, "FAQ",
                req.getQuestion(), answer,
                llmProvider.getProviderName(), llmProvider.getModelName(),
                requestId, latency);

        return buildResponse(answer, "FAQ", requestId, latency);
    }

    // ── Helper ───────────────────────────────────────────────────────────────

    private AiResponse buildResponse(String answer, String type, String requestId, long latencyMs) {
        return AiResponse.builder()
                .answer(answer)
                .requestType(type)
                .model(llmProvider.getModelName())
                .provider(llmProvider.getProviderName())
                .requestId(requestId)
                .timestamp(LocalDateTime.now())
                .latencyMs(latencyMs)
                .build();
    }
}

