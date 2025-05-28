package com.example.sandboxspring.repository;

import com.example.sandboxspring.entity.Script;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ScriptRepository extends JpaRepository<Script, Long> {
    List<Script> findByType(Script.ScriptType type);
    List<Script> findByCreatedBy(String createdBy);

}