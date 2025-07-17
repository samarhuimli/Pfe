// RestTemplateConfig.java
package com.example.sandboxspring.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestTemplate;

// Indique que cette classe contient des configurations Spring
@Configuration
public class RestTemplateConfig {

    // Crée un bean RestTemplate que Spring gérera
    @Bean
    public RestTemplate restTemplate() {
        return new RestTemplate();
    }
}