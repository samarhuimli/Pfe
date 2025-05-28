package com.example.sandboxspring.repository;

import com.example.sandboxspring.entity.ExecutionResult;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ExecutionResultRepository extends JpaRepository<ExecutionResult, Long> {
    List<ExecutionResult> findByScriptId(Long scriptId);
    List<ExecutionResult> findByStatus(ExecutionResult.ExecutionStatus status);
}
