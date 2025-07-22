package com.example.sandboxspring.repository;

import com.example.sandboxspring.entity.SecurityConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;
import java.util.Set;

public interface SecurityConfigRepository extends JpaRepository<SecurityConfig, Long> {
    Optional<SecurityConfig> findByConfigType(String configType);

    @Modifying
    @Query("DELETE FROM SecurityConfigValues v WHERE v.config.id IN (SELECT c.id FROM SecurityConfig c WHERE c.configType = :configType)")
    void deleteConfigValuesByConfigType(String configType);

    @Query("SELECT v.value FROM SecurityConfigValues v WHERE v.config.id = :configId")
    Set<String> findValuesByConfigId(Long configId);
}