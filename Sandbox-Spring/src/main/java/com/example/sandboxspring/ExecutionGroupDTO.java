package com.example.sandboxspring;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionGroupDTO {
    private Long scriptId;
    private String title;
    private String createdBy;
    private List<ExecutionDTO> executions;
}
