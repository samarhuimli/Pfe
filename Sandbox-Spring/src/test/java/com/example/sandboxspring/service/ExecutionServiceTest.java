package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.ExecutionResult;
import com.example.sandboxspring.entity.Script;
import com.example.sandboxspring.repository.ExecutionResultRepository;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExecutionServiceTest {

    @Mock
    private ExecutionResultRepository executionResultRepository;

    @Mock
    private ThreadPoolTaskExecutor taskExecutor;

    @Mock
    private EntityManager entityManager;

    @InjectMocks
    private ExecutionService executionService;

    private Script testScript;

 @BeforeEach
    void setUp() {
        testScript = new Script();
        testScript.setId(1L);
        testScript.setTitle("Analyse de Performance Financière");
        testScript.setContent("import pandas as pd\nimport numpy as np\n\n# Simulation de données financières\nprices = [100, 102, 98, 105, 110, 108, 115, 120, 118, 125]\nreturns = [(prices[i]/prices[i-1] - 1) * 100 for i in range(1, len(prices))]\n\n# Calculs financiers\nvolatility = np.std(returns)\nsharpe_ratio = np.mean(returns) / volatility if volatility > 0 else 0\nmax_return = max(returns)\nmin_return = min(returns)\n\nresult = {\n    'rendement_moyen': round(np.mean(returns), 2),\n    'volatilite': round(volatility, 2),\n    'ratio_sharpe': round(sharpe_ratio, 2),\n    'rendement_max': round(max_return, 2),\n    'rendement_min': round(min_return, 2)\n}\nprint(f'Analyse Financière: {result}')");
        testScript.setType(Script.ScriptType.PYTHON);
        testScript.setCreatedBy("financial_analyst");
        
        // Injection du EntityManager mocké
        ReflectionTestUtils.setField(executionService, "entityManager", entityManager);
    }

    @Test
    void executeScript_Success_ShouldReturnSuccessfulResult() throws Exception {
        // Arrange - Préparation des données de test
        String expectedOutput = 
        "Python Execution Result:\n" +
        "═══════════════════════════════════════════════════════════\n" +
        "📊 RAPPORT D'ANALYSE FINANCIÈRE\n" +
        "═══════════════════════════════════════════════════════════\n" +
        "📈 Rendement Moyen    : 2.78%\n" +
        "📉 Volatilité         : 6.45%\n" +
        "⚖️  Ratio de Sharpe    : 0.43\n" +
        "🔺 Rendement Maximum  : 9.52%\n" +
        "🔻 Rendement Minimum  : -3.92%\n" +
        "═══════════════════════════════════════════════════════════\n" +
        "✅ ANALYSE TERMINÉE AVEC SUCCÈS\n" +
        "🕐 Temps d'exécution: 1.2s\n" +
        "═══════════════════════════════════════════════════════════";
        CompletableFuture<String> future = CompletableFuture.completedFuture(expectedOutput);
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);
        ExecutionResult savedResult = new ExecutionResult();
        savedResult.setId(1L);
        savedResult.setOutput(expectedOutput);
        savedResult.setStatus(ExecutionResult.ExecutionStatus.SUCCESS);
        when(executionResultRepository.save(any(ExecutionResult.class))).thenReturn(savedResult);

        // Act - Exécution de la méthode à tester
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert - Vérification des résultats
        assertNotNull(result);
        assertEquals(ExecutionResult.ExecutionStatus.SUCCESS, result.getStatus());
        assertEquals(expectedOutput, result.getOutput());
        assertNull(result.getError());
        
        // Vérification des interactions avec les mocks
        verify(executionResultRepository).save(any(ExecutionResult.class));
        verify(taskExecutor).submit(any(java.util.concurrent.Callable.class));
    }

    @Test
    void executeScript_PythonType_ShouldReturnPythonOutput() throws Exception {
        // Arrange
        testScript.setType(Script.ScriptType.PYTHON);
        String expectedOutput = "Python Execution Result:\nprint('Hello World')";
        CompletableFuture<String> future = CompletableFuture.completedFuture(expectedOutput);
        
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);
        
        ExecutionResult savedResult = new ExecutionResult();
        savedResult.setStatus(ExecutionResult.ExecutionStatus.SUCCESS);
        savedResult.setOutput(expectedOutput);
        when(executionResultRepository.save(any(ExecutionResult.class))).thenReturn(savedResult);

        // Act
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert
        assertEquals(ExecutionResult.ExecutionStatus.SUCCESS, result.getStatus());
        assertTrue(result.getOutput().contains("Python Execution Result:"));
    }

    @Test
    void executeScript_RType_ShouldReturnROutput() throws Exception {
        // Arrange
        testScript.setType(Script.ScriptType.R);
        testScript.setContent("x <- 1:10");
        String expectedOutput = "R Execution Result:\nx <- 1:10";
        CompletableFuture<String> future = CompletableFuture.completedFuture(expectedOutput);
        
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);
        
        ExecutionResult savedResult = new ExecutionResult();
        savedResult.setStatus(ExecutionResult.ExecutionStatus.SUCCESS);
        savedResult.setOutput(expectedOutput);
        when(executionResultRepository.save(any(ExecutionResult.class))).thenReturn(savedResult);

        // Act
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert
        assertEquals(ExecutionResult.ExecutionStatus.SUCCESS, result.getStatus());
        assertTrue(result.getOutput().contains("R Execution Result:"));
    }

    @Test
    void executeScript_SQLType_ShouldReturnSQLOutput() throws Exception {
        // Arrange
        testScript.setType(Script.ScriptType.SQL);
        testScript.setContent("SELECT * FROM users");
        String expectedOutput = "SQL Execution Result:\nSELECT * FROM users";
        CompletableFuture<String> future = CompletableFuture.completedFuture(expectedOutput);
        
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);
        
        ExecutionResult savedResult = new ExecutionResult();
        savedResult.setStatus(ExecutionResult.ExecutionStatus.SUCCESS);
        savedResult.setOutput(expectedOutput);
        when(executionResultRepository.save(any(ExecutionResult.class))).thenReturn(savedResult);

        // Act
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert
        assertEquals(ExecutionResult.ExecutionStatus.SUCCESS, result.getStatus());
        assertTrue(result.getOutput().contains("SQL Execution Result:"));
    }

    @Test
    void executeScript_Timeout_ShouldReturnTimeoutStatus() throws Exception {
        // Arrange
        CompletableFuture<String> future = new CompletableFuture<>();
        future.completeExceptionally(new java.util.concurrent.TimeoutException("Timeout"));
        
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);

        // Act
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert
        assertEquals(ExecutionResult.ExecutionStatus.FAILED, result.getStatus());
        assertTrue(result.getError().contains("TimeoutException"));
        assertNull(result.getOutput());
        verify(entityManager).detach(result);
        verify(executionResultRepository, never()).save(any(ExecutionResult.class));
    }

    @Test
    void executeScript_Exception_ShouldReturnFailedStatus() throws Exception {
        // Arrange
        CompletableFuture<String> future = new CompletableFuture<>();
        future.completeExceptionally(new RuntimeException("Script execution failed"));
        
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);

        // Act
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert
        assertEquals(ExecutionResult.ExecutionStatus.FAILED, result.getStatus());
        assertTrue(result.getError().contains("RuntimeException: Script execution failed"));
        assertNull(result.getOutput());
        verify(entityManager).detach(result);
        verify(executionResultRepository, never()).save(any(ExecutionResult.class));
    }

    @Test
    void countByStatus_ShouldReturnCorrectCount() {
        // Arrange
        String status = "SUCCESS";
        int expectedCount = 5;
        when(executionResultRepository.countByStatus(status)).thenReturn(expectedCount);

        // Act
        int actualCount = executionService.countByStatus(status);

        // Assert
        assertEquals(expectedCount, actualCount);
        verify(executionResultRepository).countByStatus(status);
    }

    @Test
    void executeScript_ShouldSetCorrectInitialValues() throws Exception {
        // Arrange
        String expectedOutput = "Python Execution Result:\nprint('Hello World')";
        CompletableFuture<String> future = CompletableFuture.completedFuture(expectedOutput);
        
        when(taskExecutor.submit(any(java.util.concurrent.Callable.class))).thenReturn(future);
        when(executionResultRepository.save(any(ExecutionResult.class))).thenAnswer(invocation -> {
            ExecutionResult result = invocation.getArgument(0);
            assertNotNull(result.getExecutedAt());
            assertEquals(testScript, result.getScript());
            return result;
        });

        // Act
        ExecutionResult result = executionService.executeScript(testScript);

        // Assert
        assertNotNull(result.getExecutedAt());
        assertEquals(testScript, result.getScript());
    }
}
