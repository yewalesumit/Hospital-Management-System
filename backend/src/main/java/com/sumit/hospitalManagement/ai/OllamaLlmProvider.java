package com.sumit.hospitalManagement.ai;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Calls a locally-running Ollama instance via HTTP.
 * Active when ollama.enabled=true (or property is absent — matchIfMissing=true).
 *
 * Ollama API: POST {base-url}/api/chat
 * Request:  { "model":"...", "stream":false, "messages":[{"role":"system","content":"..."},{"role":"user","content":"..."}] }
 * Response: { "message":{ "content":"..." } }
 */
@Component
@ConditionalOnProperty(name = "ollama.enabled", havingValue = "true", matchIfMissing = true)
@Slf4j
public class OllamaLlmProvider implements LlmProvider {

    private static final String CHAT_PATH = "/api/chat";

    private final String baseUrl;
    private final String model;
    private final RestTemplate restTemplate;
    private final ObjectMapper mapper = new ObjectMapper();

    public OllamaLlmProvider(
            @Value("${ollama.base-url:http://localhost:11434}") String baseUrl,
            @Value("${ollama.model:llama3.1:8b-instruct}") String model,
            @Qualifier("ollamaRestTemplate") RestTemplate restTemplate) {
        this.baseUrl      = baseUrl;
        this.model        = model;
        this.restTemplate = restTemplate;
        log.info("OllamaLlmProvider initialised — url={} model={}", baseUrl, model);
    }

    @Override
    public String complete(String systemPrompt, String userMessage) {
        try {
            Map<String, Object> body = new LinkedHashMap<>();
            body.put("model", model);
            body.put("stream", false);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.add(Map.of("role", "user",   "content", userMessage));
            body.put("messages", messages);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(mapper.writeValueAsString(body), headers);

            ResponseEntity<String> response =
                    restTemplate.exchange(baseUrl + CHAT_PATH, HttpMethod.POST, entity, String.class);

            JsonNode root   = mapper.readTree(response.getBody());
            String   answer = root.path("message").path("content").asText("");

            if (answer.isBlank()) {
                log.warn("Ollama returned blank content for model={}", model);
                return "Not found in records.";
            }
            log.info("Ollama answered — model={} chars={}", model, answer.length());
            return answer;

        } catch (Exception e) {
            log.error("Ollama call failed: {}", e.getMessage());
            return "Error: AI service is temporarily unavailable. Please try again later.";
        }
    }

    @Override public String getProviderName() { return "ollama"; }
    @Override public String getModelName()    { return model; }
}

