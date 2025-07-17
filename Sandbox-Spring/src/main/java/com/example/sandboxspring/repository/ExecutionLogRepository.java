package com.example.sandboxspring.repository;

import com.example.sandboxspring.entity.ExecutionLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ExecutionLogRepository extends JpaRepository<ExecutionLog, Long> {
}