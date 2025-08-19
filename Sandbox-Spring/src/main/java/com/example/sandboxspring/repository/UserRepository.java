package com.example.sandboxspring.repository;


import java.util.Optional;


import java.util.Optional;

import com.example.sandboxspring.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, String> {
    Optional<User> findByUsername(String username);
}