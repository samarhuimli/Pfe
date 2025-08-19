package com.example.sandboxspring.entity;



import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "users")
@Data
public class User {
    @Id
    private String username;
    private String password;
    private String role; // ex. : "ROLE_USER", "ROLE_ADMIN"
    private boolean enabled;
}