package com.example.sandboxspring.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Entity
@Table(name = "scripts")
public class Script {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String title;

    @Lob
    @JdbcTypeCode(SqlTypes.LONGVARCHAR)
    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "created_by", nullable = false, length = 50)
    private String createdBy;

    @Column(name = "created_at", nullable = false, columnDefinition = "TIMESTAMP")
    private LocalDateTime createdAt = LocalDateTime.now();

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private ScriptType type;

    @OneToMany(mappedBy = "script", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @JsonIgnore
    private List<ExecutionResult> executionResults = new ArrayList<>();

    public enum ScriptType {
        PYTHON,
        R,
        SQL
    }

    public Script() {}

    public Script(String title, String content, String createdBy, ScriptType type) {
        this.title = title;
        this.content = content;
        this.createdBy = createdBy;
        this.type = type;
    }

    @Override
    public String toString() {
        return "Script{" +
                "id=" + id +
                ", title='" + title + '\'' +
                ", createdBy='" + createdBy + '\'' +
                ", type=" + type +
                '}';
    }
}