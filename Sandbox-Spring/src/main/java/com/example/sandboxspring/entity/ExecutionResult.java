package com.example.sandboxspring.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.LocalDateTime;

@Entity
@Table(name = "execution_results")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExecutionResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Lob
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String output;

    @Lob
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    private String error;

    @Column(name = "execution_time")
    private String executionTime; // Champ ajouté avec colonne

    @CreationTimestamp
    @Column(name = "executed_at", nullable = false, updatable = false)
    private LocalDateTime executedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "script_id", nullable = true,
            foreignKey = @ForeignKey(name = "fk_execution_script"))
    private Script script;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ExecutionStatus status;

    public enum ExecutionStatus {
        SUCCESS, FAILED, TIMEOUT, PENDING
    }

    public boolean isSuccessful() {
        return ExecutionStatus.SUCCESS.equals(status);
    }
}