package com.example.sandboxspring;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Builder
@NoArgsConstructor
@AllArgsConstructor
@Data
public class ExecutionDTO {
    private Long id;
    private String output;
    private String error;
    private boolean success;
    private LocalDateTime executedAt;
}
