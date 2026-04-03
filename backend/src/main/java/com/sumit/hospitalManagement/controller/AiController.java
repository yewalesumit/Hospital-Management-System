package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.*;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/**
 * REST controller for the AI MVP endpoints.
 *
 * Routes (relative to server.servlet.context-path=/api/v1):
 *   POST /api/v1/ai/summary  — DOCTOR or ADMIN — structured patient summary
 *   POST /api/v1/ai/qa       — authenticated   — grounded Q&A about a patient
 *   POST /api/v1/ai/faq      — public          — general hospital FAQ
 *
 * Route security is declared in WebSecurityConfig.securityFilterChain().
 */
@RestController
@RequestMapping("/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;

    /**
     * POST /api/v1/ai/summary
     * Body: { "patientId": 42 }
     * Requires role DOCTOR or ADMIN.
     * Doctor may only query patients they have an appointment with.
     */
    @PostMapping("/summary")
    public ResponseEntity<AiResponse> summary(
            @RequestBody AiSummaryRequest req,
            @AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(aiService.summary(req, caller));
    }

    /**
     * POST /api/v1/ai/qa
     * Body: { "patientId": 42, "question": "What is the patient's blood group?" }
     * Requires any authenticated user.
     * Patient may only query their own record; doctor only their appointment patients.
     */
    @PostMapping("/qa")
    public ResponseEntity<AiResponse> qa(
            @RequestBody AiQaRequest req,
            @AuthenticationPrincipal User caller) {
        return ResponseEntity.ok(aiService.qa(req, caller));
    }

    /**
     * POST /api/v1/ai/faq
     * Body: { "question": "How do I book an appointment?" }
     * Public — no authentication required.
     * Never accesses patient data; uses only the FAQ knowledge base.
     */
    @PostMapping("/faq")
    public ResponseEntity<AiResponse> faq(@RequestBody AiFaqRequest req) {
        return ResponseEntity.ok(aiService.faq(req));
    }
}

