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
    private boolean enabled = true;
    private String password;
    private String role;
    private String validationCode;
    private String email;
}