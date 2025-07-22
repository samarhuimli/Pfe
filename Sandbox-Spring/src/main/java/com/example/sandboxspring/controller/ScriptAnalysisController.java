package com.example.sandboxspring.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

@RestController
@CrossOrigin(origins = "*")
@RequestMapping("/analyze")
public class ScriptAnalysisController {

    @PostMapping("/python")
    public ResponseEntity<String> analyzePython(@RequestBody String script) {
        return runAnalysis(script, "py", new String[]{"bandit", "-r"});
    }

    @PostMapping("/r")
    public ResponseEntity<String> analyzeR(@RequestBody String script) {
        // lintr s'utilise via Rscript -e "lintr::lint('file.R')"
        return runAnalysis(script, "R", new String[]{"Rscript", "-e"});
    }

    private ResponseEntity<String> runAnalysis(String script, String extension, String[] baseCommand) {
        Path tempFile = null;
        try {
            // Créer un fichier temporaire
            tempFile = Files.createTempFile("script-", "." + extension);
            Files.write(tempFile, script.getBytes());

            Process process;
            if (extension.equals("py")) {
                // Bandit: bandit -r <file>
                ProcessBuilder pb = new ProcessBuilder(baseCommand[0], baseCommand[1], tempFile.toString());
                pb.redirectErrorStream(true);
                process = pb.start();
            } else {
                // lintr: Rscript -e "lintr::lint('file.R')"
                String lintCmd = String.format("lintr::lint('%s')", tempFile.toString().replace("\\", "/"));
                ProcessBuilder pb = new ProcessBuilder(baseCommand[0], baseCommand[1], lintCmd);
                pb.redirectErrorStream(true);
                process = pb.start();
            }

            BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()));
            StringBuilder output = new StringBuilder();
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
            }
            int exitCode = process.waitFor();
            Files.deleteIfExists(tempFile);
            return ResponseEntity.ok(output.toString());
        } catch (Exception e) {
            if (tempFile != null) {
                try { Files.deleteIfExists(tempFile); } catch (IOException ignored) {}
            }
            return ResponseEntity.status(500).body("Erreur lors de l'analyse : " + e.getMessage());
        }
    }
} 