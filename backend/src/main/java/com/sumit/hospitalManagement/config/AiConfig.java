package com.sumit.hospitalManagement.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

/**
 * Spring configuration for the AI MVP.
 * Provides a dedicated RestTemplate bean for Ollama HTTP calls
 * with generous timeouts suitable for local LLM inference.
 */
@Configuration
public class AiConfig {

    /** 60-second connect timeout; 120-second read timeout for LLM responses. */
    @Bean("ollamaRestTemplate")
    public RestTemplate ollamaRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(60_000);
        factory.setReadTimeout(120_000);
        return new RestTemplate(factory);
    }
}

