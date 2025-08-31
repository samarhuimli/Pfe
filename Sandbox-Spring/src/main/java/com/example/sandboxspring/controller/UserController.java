package com.example.sandboxspring.controller;

import com.example.sandboxspring.entity.User;
import com.example.sandboxspring.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserService userService;

    // GET all users - Public access
    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userService.getAllUsers();
        return ResponseEntity.ok(users);
    }

    // GET user by username - Public access
    @GetMapping("/{username}")
    public ResponseEntity<User> getUserByUsername(@PathVariable String username) {
        Optional<User> user = userService.getUserByUsername(username);
        if (user.isPresent()) {
            return ResponseEntity.ok(user.get());
        }
        return ResponseEntity.notFound().build();
    }

    // POST create new user - Public access
    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody User user) {
        try {
            // Validate required fields
            if (user.getUsername() == null || user.getUsername().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Username is required"));
            }
            
            if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Email is required"));
            }
            
            if (user.getPassword() == null || user.getPassword().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Password is required"));
            }

            // Validate role
            if (user.getRole() != null && 
                !user.getRole().equals("ROLE_ADMIN") && 
                !user.getRole().equals("ROLE_SCIENTIST") && 
                !user.getRole().equals("ROLE_ANALYSTE")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid role. Must be ROLE_ADMIN, ROLE_SCIENTIST, or ROLE_ANALYSTE"));
            }

            // Check if user already exists
            if (userService.userExists(user.getUsername())) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "User already exists"));
            }

            User createdUser = userService.createUser(user);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdUser);
        } catch (Exception e) {
            e.printStackTrace(); // Log the full stack trace
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to create user: " + e.getMessage()));
        }
    }

    // PUT update user - Public access
    @PutMapping("/{username}")
    public ResponseEntity<?> updateUser(@PathVariable String username, @RequestBody User user) {
        try {
            // Validate role if provided
            if (user.getRole() != null && 
                !user.getRole().equals("ROLE_ADMIN") && 
                !user.getRole().equals("ROLE_SCIENTIST") && 
                !user.getRole().equals("ROLE_ANALYSTE")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid role. Must be ROLE_ADMIN, ROLE_SCIENTIST, or ROLE_ANALYSTE"));
            }

            User updatedUser = userService.updateUser(username, user);
            if (updatedUser != null) {
                return ResponseEntity.ok(updatedUser);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update user: " + e.getMessage()));
        }
    }

    // PUT update validation code - Public access
    @PutMapping("/{username}/validation-code")
    public ResponseEntity<?> updateValidationCode(@PathVariable String username, 
                                                  @RequestBody Map<String, String> request) {
        try {
            String validationCode = request.get("validationCode");
            if (validationCode == null || validationCode.trim().isEmpty()) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Validation code is required"));
            }

            User updatedUser = userService.updateValidationCode(username, validationCode);
            if (updatedUser != null) {
                return ResponseEntity.ok(updatedUser);
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to update validation code: " + e.getMessage()));
        }
    }

    // DELETE user - Public access
    @DeleteMapping("/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        try {
            boolean deleted = userService.deleteUser(username);
            if (deleted) {
                return ResponseEntity.ok(Map.of("message", "User deleted successfully"));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to delete user: " + e.getMessage()));
        }
    }

    // GET users by role - Public access
    @GetMapping("/role/{role}")
    public ResponseEntity<?> getUsersByRole(@PathVariable String role) {
        try {
            // Validate role parameter
            String roleWithPrefix = role.startsWith("ROLE_") ? role : "ROLE_" + role.toUpperCase();
            if (!roleWithPrefix.equals("ROLE_ADMIN") && 
                !roleWithPrefix.equals("ROLE_SCIENTIST") && 
                !roleWithPrefix.equals("ROLE_ANALYSTE")) {
                return ResponseEntity.badRequest()
                    .body(Map.of("error", "Invalid role. Must be ADMIN, SCIENTIST, or ANALYSTE"));
            }

            List<User> users = userService.getUsersByRole(roleWithPrefix);
            return ResponseEntity.ok(users);
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to get users by role: " + e.getMessage()));
        }
    }


    // PUT enable user - Public access
    @PutMapping("/{username}/enable")
    public ResponseEntity<?> enableUser(@PathVariable String username) {
        try {
            User updatedUser = userService.enableUser(username);
            if (updatedUser != null) {
                return ResponseEntity.ok(Map.of("message", "User enabled successfully", "user", updatedUser));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to enable user: " + e.getMessage()));
        }
    }

    // PUT disable user - Public access
    @PutMapping("/{username}/disable")
    public ResponseEntity<?> disableUser(@PathVariable String username) {
        try {
            User updatedUser = userService.disableUser(username);
            if (updatedUser != null) {
                return ResponseEntity.ok(Map.of("message", "User disabled successfully", "user", updatedUser));
            }
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "Failed to disable user: " + e.getMessage()));
        }
    }

    // GET check if user exists - Public access
    @GetMapping("/{username}/exists")
    public ResponseEntity<Map<String, Boolean>> checkUserExists(@PathVariable String username) {
        boolean exists = userService.userExists(username);
        return ResponseEntity.ok(Map.of("exists", exists));
    }
}
