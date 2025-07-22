package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.SecurityConfig;
import com.example.sandboxspring.entity.SecurityConfigValues;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class SecurityConfigService {
    private static final Logger logger = LoggerFactory.getLogger(SecurityConfigService.class);

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional(readOnly = true)
    public Set<String> getForbiddenTables() {
        Query query = entityManager.createQuery(
                "SELECT c FROM SecurityConfig c WHERE c.configType = :type", SecurityConfig.class);
        query.setParameter("type", "forbidden_tables");
        SecurityConfig config = (SecurityConfig) query.getResultList().stream().findFirst().orElse(new SecurityConfig());
        return config.getValues() != null ? new HashSet<>(config.getValues().stream().map(SecurityConfigValues::getValue).toList()) : new HashSet<>();
    }

    @Transactional(readOnly = true)
    public Set<String> getAllowedOperations() {
        Query query = entityManager.createQuery(
                "SELECT c FROM SecurityConfig c WHERE c.configType = :type", SecurityConfig.class);
        query.setParameter("type", "allowed_operations");
        SecurityConfig config = (SecurityConfig) query.getResultList().stream().findFirst().orElse(new SecurityConfig());
        return config.getValues() != null ? new HashSet<>(config.getValues().stream().map(SecurityConfigValues::getValue).toList()) : new HashSet<>();
    }

    @Transactional
    public void saveConfigWithValues(SecurityConfig config, Set<String> values) {
        logger.info("Début de la sauvegarde - configType: {}, values: {}", config.getConfigType(), values);

        try {
            Query query = entityManager.createQuery(
                    "SELECT c FROM SecurityConfig c WHERE c.configType = :type", SecurityConfig.class);
            query.setParameter("type", config.getConfigType());
            SecurityConfig existingConfig = (SecurityConfig) query.getResultList().stream().findFirst().orElse(null);

            if (existingConfig != null) {
                // Supprimer d'abord les valeurs associées
                Query deleteValuesQuery = entityManager.createQuery(
                        "DELETE FROM SecurityConfigValues v WHERE v.config.id = :configId");
                deleteValuesQuery.setParameter("configId", existingConfig.getId());
                int deletedValueRows = deleteValuesQuery.executeUpdate();
                logger.info("Lignes de valeurs supprimées: {}", deletedValueRows);

                // Mettre à jour la configuration existante au lieu de la supprimer et recréer
                existingConfig.getValues().clear(); // Nettoyer les anciennes valeurs
                entityManager.merge(existingConfig); // Mettre à jour l'entité existante
                logger.info("Configuration mise à jour - ID: {}", existingConfig.getId());
                config = existingConfig; // Réutiliser l'entité existante
            } else {
                // Si aucune configuration existante, créer une nouvelle
                entityManager.persist(config);
                logger.info("Nouvelle configuration persistée - ID: {}", config.getId());
            }

            // Ajout des nouvelles valeurs
            for (String value : values) {
                SecurityConfigValues configValue = new SecurityConfigValues();
                configValue.setConfig(config);
                configValue.setValue(value);
                entityManager.persist(configValue);
            }

            entityManager.flush();
            logger.info("Flush effectué pour " + config.getConfigType() + " avec valeurs: " + values);

            Query verifyQuery = entityManager.createQuery(
                    "SELECT c FROM SecurityConfig c JOIN FETCH c.values WHERE c.configType = :type", SecurityConfig.class);
            verifyQuery.setParameter("type", config.getConfigType());
            SecurityConfig verified = (SecurityConfig) verifyQuery.getResultList().stream().findFirst().orElse(null);
            Set<String> verifiedValues = verified != null && verified.getValues() != null
                    ? new HashSet<>(verified.getValues().stream().map(SecurityConfigValues::getValue).toList())
                    : new HashSet<>();
            logger.info("Vérification post-flush - Config trouvée: {}", verifiedValues);
        } catch (Exception e) {
            logger.error("Erreur lors de la sauvegarde : ", e);
            throw e;
        }
    }

    @Transactional
    public void deleteConfig(String type) {
        logger.info("Suppression de configType: {}", type);
        Query deleteQuery = entityManager.createQuery(
                "DELETE FROM SecurityConfig c WHERE c.configType = :type");
        deleteQuery.setParameter("type", type);
        deleteQuery.executeUpdate();
        logger.info("Suppression terminée pour configType: {}", type);
    }
}