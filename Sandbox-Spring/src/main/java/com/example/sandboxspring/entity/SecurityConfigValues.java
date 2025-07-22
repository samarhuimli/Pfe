package com.example.sandboxspring.entity;

import jakarta.persistence.*;

@Entity
public class SecurityConfigValues {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "config_id")
    private SecurityConfig config;

    private String value;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public SecurityConfig getConfig() { return config; }
    public void setConfig(SecurityConfig config) { this.config = config; }

    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}