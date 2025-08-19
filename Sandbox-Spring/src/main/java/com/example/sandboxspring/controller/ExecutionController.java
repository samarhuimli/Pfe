package com.example.sandboxspring.controller;

import com.example.sandboxspring.ExecutionDTO;
import com.example.sandboxspring.ExecutionGroupDTO;
import com.example.sandboxspring.ExecutionResultDTO;
import com.example.sandboxspring.entity.ExecutionLog;
import com.example.sandboxspring.entity.ExecutionResult;
import com.example.sandboxspring.entity.Script;
import com.example.sandboxspring.exception.ResourceNotFoundException;
import com.example.sandboxspring.repository.ExecutionLogRepository;
import com.example.sandboxspring.repository.ExecutionResultRepository;
import com.example.sandboxspring.repository.ScriptRepository;
import com.example.sandboxspring.security.SecurityManager;
import com.example.sandboxspring.service.ExecutionService;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/executions")
@RequiredArgsConstructor
public class ExecutionController {

    private static final Logger logger = LoggerFactory.getLogger(ExecutionController.class);
    private final ExecutionService executionService;
    private final ExecutionResultRepository executionResultRepository;
    private final ScriptRepository scriptRepository;
    private final RestTemplate restTemplate;
    private final SecurityManager securityManager;
    private final ExecutionLogRepository executionLogRepository;
    private static final String PYTHON_API_URL = "http://python-api:8083/execute";

    @PostConstruct
    public void init() {
        logger.info("SecurityManager injecté avec succès : {}", securityManager);
    }

    @PostMapping("/executeR")
    @CrossOrigin(origins = "http://localhost:4200")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent exécuter des scripts R
    public ResponseEntity<ExecutionResultDTO> executeRCode(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        Long scriptId = request.get("scriptId") != null ? Long.valueOf(request.get("scriptId").toString()) : null;

        ExecutionResultDTO errorDTO = new ExecutionResultDTO();
        if (code == null || code.trim().isEmpty()) {
            errorDTO.setError("Erreur: Le code R est vide ou absent.");
            errorDTO.setStatus("FAILED");
            saveExecutionLog("Code R vide ou absent", ExecutionLog.ExecutionType.R);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDTO);
        }

        logger.info("Script R reçu : code={}, scriptId={}", code, scriptId);

        // Validation du script avec SecurityManager
        logger.info("Début de la validation du script : {}", code);
        try {
            securityManager.validateExecution(code); // Remplace validateScript par validateExecution
        } catch (SecurityException e) {
            logger.info("Résultat de la validation : {}", e.getMessage());
            errorDTO.setError(e.getMessage());
            errorDTO.setStatus("FAILED");
            saveExecutionLog("Validation échouée: " + e.getMessage(), ExecutionLog.ExecutionType.R);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDTO);
        }

        ExecutionResultDTO resultDTO = new ExecutionResultDTO();
        try {
            saveExecutionLog("Début de l'exécution R pour code: " + code, ExecutionLog.ExecutionType.R);

            String escapedCode = code
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f");
            String requestBody = "{\"code\": \"" + escapedCode + "\"}";
            logger.info("Corps de la requête envoyé : {}", requestBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            String rApiUrl = "http://r-api:8086/execute";
            logger.info("Tentative de connexion à l'API R avec URL : {}", rApiUrl);
            ResponseEntity<String> response = restTemplate.postForEntity(rApiUrl, entity, String.class);
            String responseBody = response.getBody();

            logger.info("Réponse brute de r-api : {}", responseBody);

            if (responseBody != null && response.getStatusCode() == HttpStatus.OK) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> jsonMap = mapper.readValue(responseBody, new TypeReference<Map<String, Object>>(){});
                String output = (jsonMap.get("output") != null) ? jsonMap.get("output").toString() : "No output";
                String error = (jsonMap.get("error") != null) ? jsonMap.get("error").toString() : "";
                String status = (jsonMap.get("status") != null) ? jsonMap.get("status").toString() : "FAILED";

                logger.info("Réponse parsed - output: {}, error: {}, status: {}", output, error, status);

                if ("SUCCESS".equals(status)) {
                    resultDTO.setOutput(output);
                    resultDTO.setStatus("SUCCESS");
                    saveExecutionLog("Exécution R réussie : " + output, ExecutionLog.ExecutionType.R);
                } else {
                    resultDTO.setError(error);
                    resultDTO.setStatus("FAILED");
                    saveExecutionLog("Erreur d'exécution R : " + error, ExecutionLog.ExecutionType.R);
                }
            } else {
                resultDTO.setError("Erreur: Échec de la communication avec l'API R - Statut: " + response.getStatusCodeValue());
                resultDTO.setStatus("FAILED");
                saveExecutionLog("Échec de la communication avec l'API R: Statut " + response.getStatusCodeValue(), ExecutionLog.ExecutionType.R);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
            }

        } catch (HttpClientErrorException e) {
            logger.error("Erreur client avec l'API R : {}, Body: {}", e.getMessage(), e.getResponseBodyAsString());
            resultDTO.setError("Erreur serveur: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            saveExecutionLog("Erreur client avec l'API R: " + e.getMessage(), ExecutionLog.ExecutionType.R);
            return ResponseEntity.status(e.getStatusCode()).body(resultDTO);
        } catch (RestClientException e) {
            logger.error("Erreur de communication avec l'API R : {}", e.getMessage(), e);
            resultDTO.setError("Erreur serveur: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            saveExecutionLog("Erreur de communication avec l'API R: " + e.getMessage(), ExecutionLog.ExecutionType.R);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
        } catch (Exception e) {
            logger.error("Erreur serveur inattendue : {}, Stacktrace: {}", e.getMessage(), e);
            resultDTO.setError("Erreur serveur: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            saveExecutionLog("Erreur serveur inattendue: " + e.getMessage(), ExecutionLog.ExecutionType.R);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
        }

        resultDTO.setExecutionTime(String.valueOf(System.currentTimeMillis()));
        resultDTO.setScriptId(scriptId);

        saveExecutionResultToDB(resultDTO);
        saveExecutionLog("Exécution R terminée - Output: " + resultDTO.getOutput(), ExecutionLog.ExecutionType.R);
        return ResponseEntity.ok(resultDTO);
    }

    @PostMapping("/executePython")
    @CrossOrigin(origins = "http://localhost:4200")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent exécuter des scripts Python
    public ResponseEntity<ExecutionResultDTO> executePythonCode(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        Long scriptId = request.get("scriptId") != null ? Long.valueOf(request.get("scriptId").toString()) : null;

        ExecutionResultDTO errorDTO = new ExecutionResultDTO();
        if (code == null || code.trim().isEmpty()) {
            errorDTO.setError("Erreur: Le code Python est vide ou absent.");
            errorDTO.setStatus("FAILED");
            saveExecutionLog("Code Python vide ou absent", ExecutionLog.ExecutionType.PYTHON);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDTO);
        }

        logger.info("Script Python reçu : code={}, scriptId={}", code, scriptId);

        // Validation du script avec SecurityManager
        logger.info("Début de la validation du script : {}", code);
        try {
            securityManager.validateExecution(code); // Remplace validateScript par validateExecution
        } catch (SecurityException e) {
            logger.info("Résultat de la validation : {}", e.getMessage());
            errorDTO.setError(e.getMessage());
            errorDTO.setStatus("FAILED");
            saveExecutionLog("Validation échouée: " + e.getMessage(), ExecutionLog.ExecutionType.PYTHON);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDTO);
        }

        ExecutionResultDTO resultDTO = new ExecutionResultDTO();
        try {
            saveExecutionLog("Début de l'exécution Python pour code: " + code, ExecutionLog.ExecutionType.PYTHON);

            String escapedCode = code
                    .replace("\\", "\\\\")
                    .replace("\"", "\\\"")
                    .replace("\n", "\\n")
                    .replace("\r", "\\r")
                    .replace("\t", "\\t")
                    .replace("\b", "\\b")
                    .replace("\f", "\\f");
            String requestBody = "{\"code\": \"" + escapedCode + "\"}";
            logger.info("Corps de la requête envoyé : {}", requestBody);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> entity = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(PYTHON_API_URL, entity, Map.class);
            Map<String, Object> responseBody = response.getBody();

            if (responseBody != null && response.getStatusCode() == HttpStatus.OK) {
                String output = (String) responseBody.get("output");
                String error = (String) responseBody.get("error");
                String status = (String) responseBody.get("status");

                if ("SUCCESS".equals(status)) {
                    resultDTO.setOutput(output != null ? output : "No output");
                    resultDTO.setStatus("SUCCESS");
                    saveExecutionLog("Exécution Python réussie : " + output, ExecutionLog.ExecutionType.PYTHON);
                } else {
                    resultDTO.setError(error != null ? error : "Opération non autorisée");
                    resultDTO.setStatus("FAILED");
                    saveExecutionLog("Erreur d'exécution Python : " + error, ExecutionLog.ExecutionType.PYTHON);
                }
            } else {
                resultDTO.setError("Erreur: Échec de la communication avec le service Python - Statut: " + response.getStatusCodeValue());
                resultDTO.setStatus("FAILED");
                saveExecutionLog("Échec de la communication avec le service Python: Statut " + response.getStatusCodeValue(), ExecutionLog.ExecutionType.PYTHON);
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
            }

        } catch (Exception e) {
            logger.error("Erreur d'exécution Python via Docker : {}", e.getMessage(), e);
            resultDTO.setError("Erreur serveur: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            saveExecutionLog("Erreur d'exécution Python: " + e.getMessage(), ExecutionLog.ExecutionType.PYTHON);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
        }

        resultDTO.setExecutionTime(String.valueOf(System.currentTimeMillis()));
        resultDTO.setScriptId(scriptId);

        saveExecutionResultToDB(resultDTO);
        saveExecutionLog("Exécution Python terminée - Output: " + resultDTO.getOutput(), ExecutionLog.ExecutionType.PYTHON);
        return ResponseEntity.ok(resultDTO);
    }

    @PostMapping("/save")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent sauvegarder des résultats
    public ResponseEntity<ExecutionResultDTO> saveExecutionResult(@RequestBody ExecutionResultDTO resultDTO) {
        ExecutionResult result = new ExecutionResult();
        result.setOutput(resultDTO.getOutput());
        result.setError(resultDTO.getError());
        Long executionTime = resultDTO.getExecutionTime() != null ? Long.parseLong(resultDTO.getExecutionTime()) : 0L;
        result.setExecutionTime(String.valueOf(executionTime));
        result.setStatus(resultDTO.getStatusEnum());
        result.setExecutedAt(LocalDateTime.now());

        if (resultDTO.getScriptId() != null) {
            Script script = scriptRepository.findById(resultDTO.getScriptId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Script non trouvé avec l'ID: " + resultDTO.getScriptId()));
            result.setScript(script);
        } else {
            result.setScript(null);
        }

        ExecutionResult saved = executionResultRepository.save(result);
        return ResponseEntity.ok(convertToDTO(saved));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent supprimer des exécutions
    public ResponseEntity<?> deleteExecution(@PathVariable Long id) {
        ExecutionResult execution = executionResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Exécution non trouvée avec l'ID: " + id));
        executionResultRepository.delete(execution);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/grouped")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Ajouté : accessible aux admins et utilisateurs
    public List<ExecutionGroupDTO> getGroupedExecutions() {
        return scriptRepository.findAll().stream()
                .map(script -> {
                    ExecutionGroupDTO dto = new ExecutionGroupDTO();
                    dto.setScriptId(script.getId());
                    dto.setTitle(script.getTitle());
                    dto.setCreatedBy(script.getCreatedBy());

                    List<ExecutionDTO> executions = script.getExecutionResults().stream()
                            .map(this::convertToExecutionDTO)
                            .collect(Collectors.toList());

                    dto.setExecutions(executions);
                    return dto;
                })
                .collect(Collectors.toList());
    }

    @GetMapping("/countstatus/{status}")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Ajouté : accessible aux admins et utilisateurs
    public int countByStatus(@PathVariable String status) {
        return executionService.countByStatus(status);
    }

    @GetMapping("/execution-logs")
    @CrossOrigin(origins = "http://localhost:4200")
    @PreAuthorize("hasAnyRole('ADMIN', 'USER')") // Ajouté : accessible aux admins et utilisateurs
    public ResponseEntity<List<ExecutionLog>> getExecutionLogs() {
        List<ExecutionLog> logs = executionLogRepository.findAll();
        return ResponseEntity.ok(logs);
    }

    @DeleteMapping("/clear-execution-logs")
    @CrossOrigin(origins = "http://localhost:4200")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent effacer les logs
    public ResponseEntity<Void> clearExecutionLogs() {
        executionLogRepository.deleteAll();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/execution-logs/{id}")
    @CrossOrigin(origins = "http://localhost:4200")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent supprimer un log
    public ResponseEntity<Void> deleteExecutionLog(@PathVariable Long id) {
        ExecutionLog log = executionLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Log non trouvé avec l'ID: " + id));
        executionLogRepository.delete(log);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/update-security")
    @CrossOrigin(origins = "http://localhost:4200")
    @PreAuthorize("hasRole('ADMIN')") // Ajouté : seuls les admins peuvent mettre à jour la sécurité
    public ResponseEntity<String> updateSecurity(@RequestBody Map<String, Object> payload) {
        logger.info("Reception de la notification de mise à jour de sécurité: {}", payload);

        // Récupérer les données envoyées
        List<String> forbiddenTables = (List<String>) payload.get("forbiddenTables");
        List<String> allowedOperations = (List<String>) payload.get("allowedOperations");

        // Mettre à jour le SecurityManager ou effectuer une action (exemple)
        if (forbiddenTables != null) {
            securityManager.setForbiddenTables(new HashSet<>(forbiddenTables)); // Conversion List -> Set
            logger.info("Tables interdites mises à jour: {}", forbiddenTables);
        }
        if (allowedOperations != null) {
            securityManager.setAllowedOperations(new HashSet<>(allowedOperations)); // Conversion List -> Set
            logger.info("Opérations autorisées mises à jour: {}", allowedOperations);
        }

        // Sauvegarder un log si nécessaire
        saveExecutionLog("Mise à jour de sécurité effectuée - Tables interdites: " + forbiddenTables + ", Opérations: " + allowedOperations, ExecutionLog.ExecutionType.SYSTEM);

        return ResponseEntity.ok("Notification de sécurité traitée avec succès");
    }

    private void saveExecutionLog(String message, ExecutionLog.ExecutionType type) {
        ExecutionLog log = new ExecutionLog();
        log.setMessage(message);
        log.setTimestamp(LocalDateTime.now());
        log.setExecutionType(type);
        try {
            executionLogRepository.save(log);
            logger.info("Log sauvegardé avec succès : message={}, type={}", message, type);
        } catch (Exception e) {
            logger.error("Échec de la sauvegarde du log : {}, erreur={}", message, e.getMessage(), e);
        }
    }

    private ExecutionResultDTO convertToDTO(ExecutionResult entity) {
        ExecutionResultDTO dto = new ExecutionResultDTO();
        dto.setScriptId(entity.getScript() != null ? entity.getScript().getId() : null);
        dto.setOutput(entity.getOutput());
        dto.setError(entity.getError());
        dto.setStatus(entity.getStatus().name());
        dto.setExecutionTime(String.valueOf(entity.getExecutionTime()));
        return dto;
    }

    private ExecutionDTO convertToExecutionDTO(ExecutionResult entity) {
        ExecutionDTO dto = new ExecutionDTO();
        dto.setId(entity.getId());
        dto.setOutput(entity.getOutput());
        dto.setError(entity.getError());
        dto.setSuccess(entity.isSuccessful());
        dto.setExecutedAt(entity.getExecutedAt());
        return dto;
    }

    private void saveExecutionResultToDB(ExecutionResultDTO resultDTO) {
        ExecutionResult result = new ExecutionResult();
        result.setOutput(resultDTO.getOutput());
        result.setError(resultDTO.getError());
        result.setExecutionTime(resultDTO.getExecutionTime());
        result.setStatus(resultDTO.getStatusEnum());
        result.setExecutedAt(LocalDateTime.now());

        if (resultDTO.getScriptId() != null) {
            Script script = scriptRepository.findById(resultDTO.getScriptId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Script non trouvé avec l'ID: " + resultDTO.getScriptId()));
            result.setScript(script);
        }

        executionResultRepository.save(result);
        logger.info("Résultat sauvegardé : output={}", resultDTO.getOutput());
    }
}