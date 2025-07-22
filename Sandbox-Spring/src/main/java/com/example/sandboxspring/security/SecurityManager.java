package com.example.sandboxspring.security;

import com.example.sandboxspring.service.SecurityConfigService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SecurityManager {
    private static final Logger logger = LoggerFactory.getLogger(SecurityManager.class);

    private Set<String> forbiddenTables;
    private Set<String> allowedOperations;

    @Autowired
    public SecurityManager(SecurityConfigService securityConfigService) {
        this.forbiddenTables = new HashSet<>(securityConfigService.getForbiddenTables());
        this.allowedOperations = new HashSet<>(securityConfigService.getAllowedOperations());
        logger.info("SecurityManager initialisé avec forbiddenTables: {} et allowedOperations: {}", forbiddenTables, allowedOperations);
    }

    // Méthode pour mettre à jour les tables interdites
    public void setForbiddenTables(Set<String> forbiddenTables) {
        if (forbiddenTables != null) {
            this.forbiddenTables.clear();
            this.forbiddenTables.addAll(forbiddenTables);
            logger.info("Tables interdites mises à jour: {}", forbiddenTables);
        }
    }

    // Méthode pour mettre à jour les opérations autorisées
    public void setAllowedOperations(Set<String> allowedOperations) {
        if (allowedOperations != null) {
            this.allowedOperations.clear();
            this.allowedOperations.addAll(allowedOperations);
            logger.info("Opérations autorisées mises à jour: {}", allowedOperations);
        }
    }

    public void validateExecution(String sqlCode) throws SecurityException {
        Set<String> usedTables = extractTables(sqlCode);
        for (String table : usedTables) {
            if (forbiddenTables.contains(table)) {
                throw new SecurityException("Table interdite : " + table);
            }
        }

        Set<String> usedOperations = extractOperations(sqlCode);
        for (String operation : usedOperations) {
            if (!allowedOperations.contains(operation)) {
                throw new SecurityException("Opération non autorisée : " + operation);
            }
        }
    }

    private Set<String> extractTables(String sqlCode) {
        Set<String> tables = new HashSet<>();
        Pattern pattern = Pattern.compile("\\bFROM\\s+(\\w+)\\b", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(sqlCode);
        while (matcher.find()) {
            tables.add(matcher.group(1).toLowerCase());
        }
        return tables;
    }

    private Set<String> extractOperations(String sqlCode) {
        Set<String> operations = new HashSet<>();
        if (sqlCode.toUpperCase().contains("SELECT")) operations.add("SELECT");
        if (sqlCode.toUpperCase().contains("INSERT")) operations.add("INSERT");
        if (sqlCode.toUpperCase().contains("UPDATE")) operations.add("UPDATE");
        if (sqlCode.toUpperCase().contains("DELETE")) operations.add("DELETE");
        return operations;
    }
}