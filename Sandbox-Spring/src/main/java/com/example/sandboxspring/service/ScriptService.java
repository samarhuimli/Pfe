package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.ExecutionResult;
import com.example.sandboxspring.entity.Script;
import com.example.sandboxspring.repository.ScriptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ScriptService {

    private final ScriptRepository scriptRepository;
    private final ExecutionService executionService;

    public List<Script> getAllScripts() {
        return scriptRepository.findAll();
    }

    public Optional<Script> getScriptById(Long id) {
        return scriptRepository.findById(id);
    }


    public Script createScript(Script script) {
        script.setCreatedAt(LocalDateTime.now());
        return scriptRepository.save(script);
    }
    public List<Script> findAllVersions(String baseTitle) {
        List<Script> scripts = scriptRepository.findAll();
        return scripts.stream()
                .filter(s -> s.getTitle().equals(baseTitle) || s.getTitle().matches(baseTitle + " v\\d+"))
                .collect(Collectors.toList());
    }

    public Script updateScript(Long id, Script scriptDetails) {
        return scriptRepository.findById(id)
                .map(originalScript -> {
                    String baseTitle = originalScript.getTitle().split(" v")[0]; // "Mon Script"

                    // Chercher combien de versions existent déjà
                    List<Script> allVersions = findAllVersions(baseTitle);

                    int nextVersionNumber = allVersions.size() + 1; // V2, V3, V4, etc.
                    String newTitle = baseTitle + " v" + nextVersionNumber;

                    Script clonedScript = new Script();
                    clonedScript.setTitle(newTitle);
                    clonedScript.setContent(scriptDetails.getContent());
                    clonedScript.setType(scriptDetails.getType());
                    clonedScript.setCreatedBy(scriptDetails.getCreatedBy());
                    clonedScript.setCreatedAt(LocalDateTime.now());

                    return scriptRepository.save(clonedScript);
                })
                .orElseThrow(() -> new RuntimeException("Script not found with id " + id));
    }



    public void deleteScript(Long id) {
        scriptRepository.deleteById(id);
    }

    public ExecutionResult executeScript(Long scriptId) {
        Script script = scriptRepository.findById(scriptId)
                .orElseThrow(() -> new RuntimeException("Script not found with id " + scriptId));

        return executionService.executeScript(script);
    }
}
