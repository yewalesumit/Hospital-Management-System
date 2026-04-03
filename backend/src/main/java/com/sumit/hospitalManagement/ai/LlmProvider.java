package com.sumit.hospitalManagement.ai;

/**
 * Provider abstraction for LLM calls.
 * Swap OllamaLlmProvider ↔ OpenAiLlmProvider ↔ MockLlmProvider
 * by changing the active @ConditionalOnProperty.
 */
public interface LlmProvider {

    /**
     * Send a system prompt + user message and return the text answer.
     * Implementations must never throw — return an error string on failure.
     */
    String complete(String systemPrompt, String userMessage);

    /** e.g. "ollama" | "openai" | "mock" */
    String getProviderName();

    /** e.g. "llama3.1:8b-instruct" | "gpt-4o-mini" | "mock-v1" */
    String getModelName();
}

