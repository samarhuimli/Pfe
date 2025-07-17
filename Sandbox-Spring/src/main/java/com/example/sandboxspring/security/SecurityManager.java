package com.example.sandboxspring.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Component
public class SecurityManager {
    private static final Logger logger = LoggerFactory.getLogger(SecurityManager.class);

    // Tables interdites
    private final String[] forbiddenTables = { "admin_logs"};
    // Opérations autorisées
    private final String[] allowedOperations = {"SELECT", "UPDATE"};

    public boolean isTableAllowed(String tableName) {
        for (String forbidden : forbiddenTables) {
            if (forbidden.equalsIgnoreCase(tableName)) {
                return false;
            }
        }
        return true;
    }

    public boolean isOperationAllowed(String query) {
        String upperQuery = query.toUpperCase();
        for (String operation : allowedOperations) {
            if (upperQuery.startsWith(operation)) {
                return true;
            }
        }
        return false;
    }

    public String validateScript(String script) {
        logger.info("Début de la validation du script : {}", script);
        if (script == null || script.trim().isEmpty()) {
            return "Script vide ou null";
        }
        String[] lines = script.split("\n");
        for (String line : lines) {
            logger.info("Analyse de la ligne : {}", line);
            line = line.trim();
            if (line.contains("cursor.execute(") || line.contains("dbExecute(")) {
                int queryStart = line.indexOf('"') + 1;
                int queryEnd = line.lastIndexOf('"');
                logger.info("Plage de la requête : start={}, end={}", queryStart, queryEnd);
                if (queryStart > 0 && queryEnd > queryStart) {
                    String query = line.substring(queryStart, queryEnd).trim();
                    logger.info("Requête extraite : {}", query);
                    String[] parts = query.split("\\s+");
                    if (parts.length > 0) {
                        String operation = parts[0].toUpperCase();
                        logger.info("Opération détectée : {}", operation);
                        if (!isOperationAllowed(operation)) {
                            return "Opération interdite : " + operation;
                        }
                        // Utiliser une regex améliorée pour détecter la table après FROM
                        if ("SELECT".equals(operation)) {
                            Pattern pattern = Pattern.compile("\\sFROM\\s+(\\w+)(?:\\s+|$)", Pattern.CASE_INSENSITIVE);
                            Matcher matcher = pattern.matcher(query);
                            if (matcher.find()) {
                                String tableName = matcher.group(1).split("\\.")[0]; // Prendre le premier mot après FROM
                                logger.info("Table détectée : {}", tableName);
                                if (!isTableAllowed(tableName)) {
                                    return "Table interdite : " + tableName;
                                }
                            }
                        }
                    }
                }
            }
        }
        return null;
    }
}