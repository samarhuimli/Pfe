package com.example.sandboxspring.controller;

import com.example.sandboxspring.entity.SecurityConfig;
import com.example.sandboxspring.service.SecurityConfigService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/security")
public class SecurityConfigController {

    @Autowired
    private SecurityConfigService securityConfigService;

    @Autowired
    private JdbcTemplate jdbcTemplate; // Ajoute cette dépendance

    @GetMapping("/tables")
    public ResponseEntity<List<String>> getTables() {
        List<String> tables = jdbcTemplate.queryForList(
                "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'",
                String.class
        );
        return ResponseEntity.ok(tables);
    }

    @GetMapping("/forbidden-tables")
    public ResponseEntity<Set<String>> getForbiddenTables() {
        return ResponseEntity.ok(securityConfigService.getForbiddenTables());
    }

    @GetMapping("/allowed-operations")
    public ResponseEntity<Set<String>> getAllowedOperations() {
        return ResponseEntity.ok(securityConfigService.getAllowedOperations());
    }

    @PostMapping("/forbidden-tables")
    public ResponseEntity<String> saveForbiddenTables(@RequestBody Set<String> values) {
        SecurityConfig config = new SecurityConfig();
        config.setConfigType("forbidden_tables");
        securityConfigService.saveConfigWithValues(config, values);
        return ResponseEntity.ok("Tables interdites sauvegardées avec succès");
    }

    @PostMapping("/allowed-operations")
    public ResponseEntity<String> saveAllowedOperations(@RequestBody Set<String> values) {
        SecurityConfig config = new SecurityConfig();
        config.setConfigType("allowed_operations");
        securityConfigService.saveConfigWithValues(config, values);
        return ResponseEntity.ok("Opérations autorisées sauvegardées avec succès");
    }

    @DeleteMapping("/forbidden-tables")
    public ResponseEntity<String> deleteForbiddenTables() {
        securityConfigService.deleteConfig("forbidden_tables");
        return ResponseEntity.ok("Tables interdites supprimées avec succès");
    }

    @DeleteMapping("/allowed-operations")
    public ResponseEntity<String> deleteAllowedOperations() {
        securityConfigService.deleteConfig("allowed_operations");
        return ResponseEntity.ok("Opérations autorisées supprimées avec succès");
    }
}