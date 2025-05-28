package com.example.sandboxspring;

import com.example.sandboxspring.entity.ExecutionResult.ExecutionStatus;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResultDTO {
    private String id;
    private Long scriptId;
    private String output;
    private String error;
    private String status;
    private String executionTime;

    public ExecutionStatus getStatusEnum() {
        try {
            return ExecutionStatus.valueOf(this.status.toUpperCase());
        } catch (IllegalArgumentException | NullPointerException e) {
            throw new IllegalArgumentException("Statut invalide: " + this.status);
        }
    }
}