package com.sumit.hospitalManagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AiResponse {
    /** The LLM-generated answer. */
    private String answer;
    /** SUMMARY | QA | FAQ */
    private String requestType;
    /** e.g. "llama3.1:8b-instruct" */
    private String model;
    /** e.g. "ollama" | "mock" */
    private String provider;
    /** UUID correlating this response to the ai_audit_log row. */
    private String requestId;
    /** Server timestamp of the response. */
    private LocalDateTime timestamp;
    /** Time from request receipt to LLM response, in milliseconds. */
    private long latencyMs;
}

