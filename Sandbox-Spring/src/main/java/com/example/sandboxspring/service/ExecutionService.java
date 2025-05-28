package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.ExecutionResult;
import com.example.sandboxspring.entity.Script;
import com.example.sandboxspring.repository.ExecutionResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.TimeoutException;

@Slf4j
@Service
@RequiredArgsConstructor
public class ExecutionService {

    private final ExecutionResultRepository executionResultRepository;
    private final ThreadPoolTaskExecutor taskExecutor;
    @PersistenceContext
    private EntityManager entityManager;

    public ExecutionResult executeScript(Script script) {
        ExecutionResult result = new ExecutionResult();
        result.setScript(script);
        result.setExecutedAt(LocalDateTime.now());
        result.setStatus(ExecutionResult.ExecutionStatus.PENDING);

        try {
            String output = taskExecutor.submit(() -> executeScriptContent(script))
                    .get(30, TimeUnit.SECONDS);

            result.setOutput(output);
            result.setStatus(ExecutionResult.ExecutionStatus.SUCCESS);
            log.info("Execution succeeded for script ID: {}", script.getId());

            return executionResultRepository.save(result); // Persister uniquement les succès

        } catch (TimeoutException e) {
            return handleFailedExecution(result, "Execution timeout after 30 seconds",
                    ExecutionResult.ExecutionStatus.TIMEOUT);
        } catch (Exception e) {
            return handleFailedExecution(result,
                    e.getClass().getSimpleName() + ": " + e.getMessage(),
                    ExecutionResult.ExecutionStatus.FAILED);
        }
    }

    private ExecutionResult handleFailedExecution(ExecutionResult result, String error,
                                                  ExecutionResult.ExecutionStatus status) {
        result.setError(error);
        result.setStatus(status);
        log.warn("Execution failed for script ID: {} - Status: {} - Error: {}",
                result.getScript().getId(), status, error);

        // Détacher l'entité du contexte JPA pour éviter une persistance involontaire
        entityManager.detach(result);
        return result; // Ne pas persister les échecs
    }

    private String executeScriptContent(Script script) throws Exception {
        switch (script.getType()) {
            case PYTHON:
                return executePythonScript(script.getContent());
            case R:
                return executeRScript(script.getContent());
            case SQL:
                return executeSQLScript(script.getContent());
            default:
                throw new IllegalArgumentException("Unsupported script type: " + script.getType());
        }
    }

    private String executePythonScript(String content) {
        return "Python Execution Result:\n" + content;
    }

    private String executeRScript(String content) {
        return "R Execution Result:\n" + content;
    }

    private String executeSQLScript(String content) {
        return "SQL Execution Result:\n" + content;
    }
}