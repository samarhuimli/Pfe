package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.ExecutionResult;
import com.example.sandboxspring.entity.Script;
import com.example.sandboxspring.repository.ScriptRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ScriptServiceTest {

    @Mock
    private ScriptRepository scriptRepository;

    @Mock
    private ExecutionService executionService;

    @InjectMocks
    private ScriptService scriptService;

    private Script testScript;
    private ExecutionResult testExecutionResult;

    @BeforeEach
    void setUp() {
        testScript = new Script();
        testScript.setId(1L);
        testScript.setTitle("Test Script");
        testScript.setContent("print('Hello World')");
        testScript.setType(Script.ScriptType.PYTHON);
        testScript.setCreatedBy("testuser");
        testScript.setCreatedAt(LocalDateTime.now());

        testExecutionResult = new ExecutionResult();
        testExecutionResult.setId(1L);
        testExecutionResult.setStatus(ExecutionResult.ExecutionStatus.SUCCESS);
        testExecutionResult.setOutput("Test output");
    }

    @Test
    void getAllScripts_ShouldReturnAllScripts() {
        // Arrange
        Script script2 = new Script();
        script2.setId(2L);
        script2.setTitle("Script 2");
        List<Script> expectedScripts = Arrays.asList(testScript, script2);
        
        when(scriptRepository.findAll()).thenReturn(expectedScripts);

        // Act
        List<Script> actualScripts = scriptService.getAllScripts();

        // Assert
        assertEquals(2, actualScripts.size());
        assertEquals(expectedScripts, actualScripts);
        verify(scriptRepository).findAll();
    }

    @Test
    void getScriptById_ExistingId_ShouldReturnScript() {
        // Arrange
        when(scriptRepository.findById(1L)).thenReturn(Optional.of(testScript));

        // Act
        Optional<Script> result = scriptService.getScriptById(1L);

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testScript, result.get());
        verify(scriptRepository).findById(1L);
    }

    @Test
    void getScriptById_NonExistingId_ShouldReturnEmpty() {
        // Arrange
        when(scriptRepository.findById(999L)).thenReturn(Optional.empty());

        // Act
        Optional<Script> result = scriptService.getScriptById(999L);

        // Assert
        assertFalse(result.isPresent());
        verify(scriptRepository).findById(999L);
    }

    @Test
    void createScript_ShouldSetCreatedAtAndSave() {
        // Arrange
        Script newScript = new Script();
        newScript.setTitle("New Script");
        newScript.setContent("print('New')");
        newScript.setType(Script.ScriptType.PYTHON);
        newScript.setCreatedBy("user");

        Script savedScript = new Script();
        savedScript.setId(2L);
        savedScript.setTitle("New Script");
        savedScript.setContent("print('New')");
        savedScript.setType(Script.ScriptType.PYTHON);
        savedScript.setCreatedBy("user");
        savedScript.setCreatedAt(LocalDateTime.now());

        when(scriptRepository.save(any(Script.class))).thenReturn(savedScript);

        // Act
        Script result = scriptService.createScript(newScript);

        // Assert
        assertNotNull(result);
        assertNotNull(newScript.getCreatedAt());
        assertEquals(savedScript, result);
        verify(scriptRepository).save(newScript);
    }

    @Test
    void findAllVersions_ShouldReturnMatchingVersions() {
        // Arrange
        String baseTitle = "Test Script";
        Script version1 = new Script();
        version1.setTitle("Test Script");
        Script version2 = new Script();
        version2.setTitle("Test Script v2");
        Script version3 = new Script();
        version3.setTitle("Test Script v3");
        Script otherScript = new Script();
        otherScript.setTitle("Other Script");

        List<Script> allScripts = Arrays.asList(version1, version2, version3, otherScript);
        when(scriptRepository.findAll()).thenReturn(allScripts);

        // Act
        List<Script> versions = scriptService.findAllVersions(baseTitle);

        // Assert
        assertEquals(3, versions.size());
        assertTrue(versions.contains(version1));
        assertTrue(versions.contains(version2));
        assertTrue(versions.contains(version3));
        assertFalse(versions.contains(otherScript));
    }

    @Test
    void updateScript_ExistingScript_ShouldCreateNewVersion() {
        // Arrange
        Script originalScript = new Script();
        originalScript.setId(1L);
        originalScript.setTitle("Original Script");
        originalScript.setContent("original content");
        originalScript.setType(Script.ScriptType.PYTHON);
        originalScript.setCreatedBy("user");

        Script updateDetails = new Script();
        updateDetails.setContent("updated content");
        updateDetails.setType(Script.ScriptType.R);
        updateDetails.setCreatedBy("user");

        // Mock existing versions
        List<Script> existingVersions = Arrays.asList(originalScript);
        
        when(scriptRepository.findById(1L)).thenReturn(Optional.of(originalScript));
        when(scriptRepository.findAll()).thenReturn(existingVersions);
        
        Script savedNewVersion = new Script();
        savedNewVersion.setId(2L);
        savedNewVersion.setTitle("Original Script v2");
        savedNewVersion.setContent("updated content");
        savedNewVersion.setType(Script.ScriptType.R);
        savedNewVersion.setCreatedBy("user");
        
        when(scriptRepository.save(any(Script.class))).thenReturn(savedNewVersion);

        // Act
        Script result = scriptService.updateScript(1L, updateDetails);

        // Assert
        assertNotNull(result);
        assertEquals("Original Script v2", result.getTitle());
        assertEquals("updated content", result.getContent());
        assertEquals(Script.ScriptType.R, result.getType());
        verify(scriptRepository).findById(1L);
        verify(scriptRepository).save(any(Script.class));
    }

    @Test
    void updateScript_NonExistingScript_ShouldThrowException() {
        // Arrange
        Script updateDetails = new Script();
        updateDetails.setContent("updated content");
        
        when(scriptRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> scriptService.updateScript(999L, updateDetails));
        
        assertEquals("Script not found with id 999", exception.getMessage());
        verify(scriptRepository).findById(999L);
        verify(scriptRepository, never()).save(any(Script.class));
    }

    @Test
    void updateScript_WithVersionedTitle_ShouldCreateCorrectNextVersion() {
        // Arrange
        Script originalScript = new Script();
        originalScript.setId(1L);
        originalScript.setTitle("My Script v2"); // Already versioned
        originalScript.setContent("original content");
        originalScript.setType(Script.ScriptType.PYTHON);

        Script updateDetails = new Script();
        updateDetails.setContent("updated content");
        updateDetails.setType(Script.ScriptType.PYTHON);
        updateDetails.setCreatedBy("user");

        // Mock existing versions - base + v2 + v3 = 3 versions
        Script baseScript = new Script();
        baseScript.setTitle("My Script");
        Script v2Script = new Script();
        v2Script.setTitle("My Script v2");
        Script v3Script = new Script();
        v3Script.setTitle("My Script v3");
        
        List<Script> allScripts = Arrays.asList(baseScript, v2Script, v3Script);
        
        when(scriptRepository.findById(1L)).thenReturn(Optional.of(originalScript));
        when(scriptRepository.findAll()).thenReturn(allScripts);
        
        Script savedNewVersion = new Script();
        savedNewVersion.setTitle("My Script v4"); // Should be v4
        
        when(scriptRepository.save(any(Script.class))).thenReturn(savedNewVersion);

        // Act
        Script result = scriptService.updateScript(1L, updateDetails);

        // Assert
        assertEquals("My Script v4", result.getTitle());
        verify(scriptRepository).save(any(Script.class));
    }

    @Test
    void deleteScript_ShouldCallRepositoryDelete() {
        // Act
        scriptService.deleteScript(1L);

        // Assert
        verify(scriptRepository).deleteById(1L);
    }

    @Test
    void executeScript_ExistingScript_ShouldReturnExecutionResult() {
        // Arrange
        when(scriptRepository.findById(1L)).thenReturn(Optional.of(testScript));
        when(executionService.executeScript(testScript)).thenReturn(testExecutionResult);

        // Act
        ExecutionResult result = scriptService.executeScript(1L);

        // Assert
        assertNotNull(result);
        assertEquals(testExecutionResult, result);
        verify(scriptRepository).findById(1L);
        verify(executionService).executeScript(testScript);
    }

    @Test
    void executeScript_NonExistingScript_ShouldThrowException() {
        // Arrange
        when(scriptRepository.findById(999L)).thenReturn(Optional.empty());

        // Act & Assert
        RuntimeException exception = assertThrows(RuntimeException.class, 
            () -> scriptService.executeScript(999L));
        
        assertEquals("Script not found with id 999", exception.getMessage());
        verify(scriptRepository).findById(999L);
        verify(executionService, never()).executeScript(any(Script.class));
    }

    @Test
    void createScript_ShouldPreserveAllFields() {
        // Arrange
        Script newScript = new Script();
        newScript.setTitle("Complex Script");
        newScript.setContent("complex content");
        newScript.setType(Script.ScriptType.SQL);
        newScript.setCreatedBy("admin");

        when(scriptRepository.save(any(Script.class))).thenAnswer(invocation -> {
            Script script = invocation.getArgument(0);
            script.setId(5L);
            return script;
        });

        // Act
        Script result = scriptService.createScript(newScript);

        // Assert
        assertEquals("Complex Script", newScript.getTitle());
        assertEquals("complex content", newScript.getContent());
        assertEquals(Script.ScriptType.SQL, newScript.getType());
        assertEquals("admin", newScript.getCreatedBy());
        assertNotNull(newScript.getCreatedAt());
        verify(scriptRepository).save(newScript);
    }
}
