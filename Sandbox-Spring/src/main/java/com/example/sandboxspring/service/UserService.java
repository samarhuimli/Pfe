package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.User;
import com.example.sandboxspring.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public List<User> getAllUsers() {
        return userRepository.findAll();
    }

    public Optional<User> getUserByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    public User createUser(User user) {
        // Encode password before saving
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        
        
        // Generate validation code if not provided
        if (user.getValidationCode() == null || user.getValidationCode().isEmpty()) {
            user.setValidationCode(UUID.randomUUID().toString());
        }
        
        // Set default role if not specified
        if (user.getRole() == null || user.getRole().isEmpty()) {
            user.setRole("ROLE_SCIENTIST"); // Default role
        }
        
        return userRepository.save(user);
    }

    public User updateUser(String username, User updatedUser) {
        Optional<User> existingUserOpt = userRepository.findByUsername(username);
        if (existingUserOpt.isPresent()) {
            User existingUser = existingUserOpt.get();
            
            // Update fields only if they are provided
            if (updatedUser.getEmail() != null && !updatedUser.getEmail().isEmpty()) {
                existingUser.setEmail(updatedUser.getEmail());
            }
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                existingUser.setPassword(passwordEncoder.encode(updatedUser.getPassword()));
            }
            if (updatedUser.getRole() != null) {
                existingUser.setRole(updatedUser.getRole());
            }
            if (updatedUser.getValidationCode() != null) {
                existingUser.setValidationCode(updatedUser.getValidationCode());
            }
            existingUser.setEnabled(updatedUser.isEnabled());
            
            return userRepository.save(existingUser);
        }
        return null;
    }

    public boolean deleteUser(String username) {
        if (userRepository.existsById(username)) {
            userRepository.deleteById(username);
            return true;
        }
        return false;
    }

    public boolean userExists(String username) {
        return userRepository.existsById(username);
    }

    public List<User> getUsersByRole(String role) {
        return userRepository.findByRole(role);
    }


    public User enableUser(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(true);
            return userRepository.save(user);
        }
        return null;
    }

    public User disableUser(String username) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setEnabled(false);
            return userRepository.save(user);
        }
        return null;
    }

    public User updateValidationCode(String username, String validationCode) {
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            user.setValidationCode(validationCode);
            return userRepository.save(user);
        }
        return null;
    }
}
