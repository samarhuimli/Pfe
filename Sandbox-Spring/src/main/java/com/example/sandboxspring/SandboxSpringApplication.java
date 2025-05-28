package com.example.sandboxspring;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.sandboxspring")
public class SandboxSpringApplication {
    public static void main(String[] args) {
        SpringApplication.run(SandboxSpringApplication.class, args);
    }
}