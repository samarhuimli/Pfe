package com.example.sandboxspring.controller;

import com.example.sandboxspring.ExecutionDTO;
import com.example.sandboxspring.ExecutionGroupDTO;
import com.example.sandboxspring.ExecutionResultDTO;
import com.example.sandboxspring.entity.ExecutionResult;
import com.example.sandboxspring.entity.Script;
import com.example.sandboxspring.exception.ResourceNotFoundException;
import com.example.sandboxspring.repository.ExecutionResultRepository;
import com.example.sandboxspring.repository.ScriptRepository;
import lombok.RequiredArgsConstructor;
import org.renjin.script.RenjinScriptEngineFactory;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import javax.script.ScriptEngine;
import javax.script.ScriptException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/executions")
@RequiredArgsConstructor
public class ExecutionController {

    private static final Logger logger = LoggerFactory.getLogger(ExecutionController.class);

    private final ExecutionResultRepository executionResultRepository;
    private final ScriptRepository scriptRepository;
    private final RestTemplate restTemplate = new RestTemplate();

    private static final String PYTHON_API_URL = "http://python-api:8083/execute";

    @PostMapping("/executeR")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<ExecutionResultDTO> executeRCode(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        Long scriptId = request.get("scriptId") != null ? Long.valueOf(request.get("scriptId").toString()) : null;

        ExecutionResultDTO errorDTO = new ExecutionResultDTO();
        if (code == null || code.trim().isEmpty()) {
            errorDTO.setError("Erreur: Le code R est vide ou absent.");
            errorDTO.setStatus("FAILED");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDTO);
        }

        logger.info("Script R reçu : code={}, scriptId={}", code, scriptId);

        ExecutionResultDTO resultDTO = new ExecutionResultDTO();
        try {
            RenjinScriptEngineFactory factory = new RenjinScriptEngineFactory();
            ScriptEngine engine = factory.getScriptEngine();

            if (engine == null) {
                logger.error("Erreur : Renjin ScriptEngine est null");
                resultDTO.setError("Erreur: Échec de l'initialisation de Renjin ScriptEngine");
                resultDTO.setStatus("FAILED");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
            }

            logger.info("Exécution du script R...");
            Object result = engine.eval(code);
            String output = result != null ? result.toString() : "No output";
            logger.info("Résultat du script R : {}", output);

            resultDTO.setOutput(output);
            resultDTO.setStatus("SUCCESS");
        } catch (ScriptException e) {
            logger.error("Erreur d'exécution R : {}", e.getMessage(), e);
            resultDTO.setError("Erreur d'exécution R: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
        } catch (Exception e) {
            logger.error("Erreur serveur inattendue : {}", e.getMessage(), e);
            resultDTO.setError("Erreur serveur: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
        }

        resultDTO.setExecutionTime(String.valueOf(System.currentTimeMillis()));
        resultDTO.setScriptId(scriptId);

        saveExecutionResultToDB(resultDTO);
        return ResponseEntity.ok(resultDTO);
    }
    @PostMapping("/executePython")
    @CrossOrigin(origins = "http://localhost:4200")
    public ResponseEntity<ExecutionResultDTO> executePythonCode(@RequestBody Map<String, Object> request) {
        String code = (String) request.get("code");
        Long scriptId = request.get("scriptId") != null ? Long.valueOf(request.get("scriptId").toString()) : null;

        ExecutionResultDTO errorDTO = new ExecutionResultDTO();
        if (code == null || code.trim().isEmpty()) {
            errorDTO.setError("Erreur: Le code Python est vide ou absent.");
            errorDTO.setStatus("FAILED");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errorDTO);
        }

        System.out.println("Script Python reçu : " + code + ", scriptId: " + scriptId);

        ExecutionResultDTO resultDTO = new ExecutionResultDTO();
        try {
            String requestBody = "{\"code\": \"" + code.replace("\"", "\\\"") + "\"}";
            System.out.println("Corps de la requête envoyé : " + requestBody);

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
                    resultDTO.setOutput(output);
                    resultDTO.setStatus("SUCCESS");
                } else {
                    resultDTO.setError(error);
                    resultDTO.setStatus("FAILED");
                }
            } else {
                resultDTO.setError("Erreur: Échec de la communication avec le service Python");
                resultDTO.setStatus("FAILED");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
            }

        } catch (Exception e) {
            System.out.println("Erreur d'exécution Python via Docker : " + e.getMessage());
            e.printStackTrace();
            resultDTO.setError("Erreur serveur: " + e.getMessage());
            resultDTO.setStatus("FAILED");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(resultDTO);
        }

        resultDTO.setExecutionTime(String.valueOf(System.currentTimeMillis()));
        resultDTO.setScriptId(scriptId);

        saveExecutionResultToDB(resultDTO);
        return ResponseEntity.ok(resultDTO);
    }
    @PostMapping("/save")
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
    public ResponseEntity<?> deleteExecution(@PathVariable Long id) {
        ExecutionResult execution = executionResultRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Exécution non trouvée avec l'ID: " + id));
        executionResultRepository.delete(execution);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/grouped")
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