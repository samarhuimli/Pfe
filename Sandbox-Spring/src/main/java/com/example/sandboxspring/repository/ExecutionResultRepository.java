package com.example.sandboxspring.repository;

import com.example.sandboxspring.entity.ExecutionResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ExecutionResultRepository extends JpaRepository<ExecutionResult, Long> {
    List<ExecutionResult> findByScriptId(Long scriptId);
    List<ExecutionResult> findByStatus(ExecutionResult.ExecutionStatus status);

    @Query("select count (*) from ExecutionResult e  where e.status= :status" )
    int countByStatus(@Param("status")  String status);

}


