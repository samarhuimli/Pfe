package com.example.sandboxspring.service;

import com.example.sandboxspring.entity.User;
import com.example.sandboxspring.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setUsername("testuser");
        testUser.setEmail("test@example.com");
        testUser.setPassword("plainPassword");
        testUser.setRole("ROLE_SCIENTIST");
        testUser.setEnabled(true);
        testUser.setValidationCode("test-validation-code");
    }

    @Test
    void getAllUsers_ShouldReturnAllUsers() {
        // Arrange
        User user2 = new User();
        user2.setUsername("user2");
        List<User> expectedUsers = Arrays.asList(testUser, user2);
        
        when(userRepository.findAll()).thenReturn(expectedUsers);

        // Act
        List<User> actualUsers = userService.getAllUsers();

        // Assert
        assertEquals(2, actualUsers.size());
        assertEquals(expectedUsers, actualUsers);
        verify(userRepository).findAll();
    }

    @Test
    void getUserByUsername_ExistingUser_ShouldReturnUser() {
        // Arrange
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));

        // Act
        Optional<User> result = userService.getUserByUsername("testuser");

        // Assert
        assertTrue(result.isPresent());
        assertEquals(testUser, result.get());
        verify(userRepository).findByUsername("testuser");
    }

    @Test
    void getUserByUsername_NonExistingUser_ShouldReturnEmpty() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        Optional<User> result = userService.getUserByUsername("nonexistent");

        // Assert
        assertFalse(result.isPresent());
        verify(userRepository).findByUsername("nonexistent");
    }

    @Test
    void createUser_ShouldEncodePasswordAndSetDefaults() {
        // Arrange
        User newUser = new User();
        newUser.setUsername("newuser");
        newUser.setEmail("new@example.com");
        newUser.setPassword("plainPassword");
        
        when(passwordEncoder.encode("plainPassword")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.createUser(newUser);

        // Assert
        assertEquals("encodedPassword", result.getPassword());
        assertEquals("ROLE_SCIENTIST", result.getRole());
        assertNotNull(result.getValidationCode());
        assertFalse(result.getValidationCode().isEmpty());
        verify(passwordEncoder).encode("plainPassword");
        verify(userRepository).save(newUser);
    }

    @Test
    void createUser_WithExistingRole_ShouldPreserveRole() {
        // Arrange
        User newUser = new User();
        newUser.setUsername("admin");
        newUser.setPassword("password");
        newUser.setRole("ROLE_ADMIN");
        
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.createUser(newUser);

        // Assert
        assertEquals("ROLE_ADMIN", result.getRole());
        verify(userRepository).save(newUser);
    }

    @Test
    void createUser_WithExistingValidationCode_ShouldPreserveCode() {
        // Arrange
        User newUser = new User();
        newUser.setUsername("user");
        newUser.setPassword("password");
        newUser.setValidationCode("existing-code");
        
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.createUser(newUser);

        // Assert
        assertEquals("existing-code", result.getValidationCode());
        verify(userRepository).save(newUser);
    }

    @Test
    void updateUser_ExistingUser_ShouldUpdateFields() {
        // Arrange
        User updatedUser = new User();
        updatedUser.setEmail("updated@example.com");
        updatedUser.setPassword("newPassword");
        updatedUser.setRole("ROLE_ADMIN");
        updatedUser.setEnabled(false);
        
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.encode("newPassword")).thenReturn("encodedNewPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.updateUser("testuser", updatedUser);

        // Assert
        assertNotNull(result);
        assertEquals("updated@example.com", result.getEmail());
        assertEquals("encodedNewPassword", result.getPassword());
        assertEquals("ROLE_ADMIN", result.getRole());
        assertFalse(result.isEnabled());
        verify(userRepository).findByUsername("testuser");
        verify(passwordEncoder).encode("newPassword");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateUser_PartialUpdate_ShouldUpdateOnlyProvidedFields() {
        // Arrange
        User partialUpdate = new User();
        partialUpdate.setEmail("newemail@example.com");
        // Password, role, and other fields are null/empty
        
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.updateUser("testuser", partialUpdate);

        // Assert
        assertNotNull(result);
        assertEquals("newemail@example.com", result.getEmail());
        assertEquals("plainPassword", result.getPassword()); // Should remain unchanged
        assertEquals("ROLE_SCIENTIST", result.getRole()); // Should remain unchanged
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    void updateUser_NonExistingUser_ShouldReturnNull() {
        // Arrange
        User updatedUser = new User();
        updatedUser.setEmail("new@example.com");
        
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        User result = userService.updateUser("nonexistent", updatedUser);

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername("nonexistent");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void deleteUser_ExistingUser_ShouldReturnTrue() {
        // Arrange
        when(userRepository.existsById("testuser")).thenReturn(true);

        // Act
        boolean result = userService.deleteUser("testuser");

        // Assert
        assertTrue(result);
        verify(userRepository).existsById("testuser");
        verify(userRepository).deleteById("testuser");
    }

    @Test
    void deleteUser_NonExistingUser_ShouldReturnFalse() {
        // Arrange
        when(userRepository.existsById("nonexistent")).thenReturn(false);

        // Act
        boolean result = userService.deleteUser("nonexistent");

        // Assert
        assertFalse(result);
        verify(userRepository).existsById("nonexistent");
        verify(userRepository, never()).deleteById(anyString());
    }

    @Test
    void userExists_ExistingUser_ShouldReturnTrue() {
        // Arrange
        when(userRepository.existsById("testuser")).thenReturn(true);

        // Act
        boolean result = userService.userExists("testuser");

        // Assert
        assertTrue(result);
        verify(userRepository).existsById("testuser");
    }

    @Test
    void userExists_NonExistingUser_ShouldReturnFalse() {
        // Arrange
        when(userRepository.existsById("nonexistent")).thenReturn(false);

        // Act
        boolean result = userService.userExists("nonexistent");

        // Assert
        assertFalse(result);
        verify(userRepository).existsById("nonexistent");
    }

    @Test
    void getUsersByRole_ShouldReturnUsersWithSpecificRole() {
        // Arrange
        User admin = new User();
        admin.setUsername("admin");
        admin.setRole("ROLE_ADMIN");
        
        List<User> adminUsers = Arrays.asList(admin);
        when(userRepository.findByRole("ROLE_ADMIN")).thenReturn(adminUsers);

        // Act
        List<User> result = userService.getUsersByRole("ROLE_ADMIN");

        // Assert
        assertEquals(1, result.size());
        assertEquals(adminUsers, result);
        verify(userRepository).findByRole("ROLE_ADMIN");
    }

    @Test
    void enableUser_ExistingUser_ShouldEnableAndReturnUser() {
        // Arrange
        testUser.setEnabled(false);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.enableUser("testuser");

        // Assert
        assertNotNull(result);
        assertTrue(result.isEnabled());
        verify(userRepository).findByUsername("testuser");
        verify(userRepository).save(testUser);
    }

    @Test
    void enableUser_NonExistingUser_ShouldReturnNull() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        User result = userService.enableUser("nonexistent");

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername("nonexistent");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void disableUser_ExistingUser_ShouldDisableAndReturnUser() {
        // Arrange
        testUser.setEnabled(true);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.disableUser("testuser");

        // Assert
        assertNotNull(result);
        assertFalse(result.isEnabled());
        verify(userRepository).findByUsername("testuser");
        verify(userRepository).save(testUser);
    }

    @Test
    void disableUser_NonExistingUser_ShouldReturnNull() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        User result = userService.disableUser("nonexistent");

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername("nonexistent");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void updateValidationCode_ExistingUser_ShouldUpdateAndReturnUser() {
        // Arrange
        String newValidationCode = "new-validation-code";
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(testUser));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.updateValidationCode("testuser", newValidationCode);

        // Assert
        assertNotNull(result);
        assertEquals(newValidationCode, result.getValidationCode());
        verify(userRepository).findByUsername("testuser");
        verify(userRepository).save(testUser);
    }

    @Test
    void updateValidationCode_NonExistingUser_ShouldReturnNull() {
        // Arrange
        when(userRepository.findByUsername("nonexistent")).thenReturn(Optional.empty());

        // Act
        User result = userService.updateValidationCode("nonexistent", "code");

        // Assert
        assertNull(result);
        verify(userRepository).findByUsername("nonexistent");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    void createUser_WithEmptyRole_ShouldSetDefaultRole() {
        // Arrange
        User newUser = new User();
        newUser.setUsername("user");
        newUser.setPassword("password");
        newUser.setRole(""); // Empty role
        
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.createUser(newUser);

        // Assert
        assertEquals("ROLE_SCIENTIST", result.getRole());
        verify(userRepository).save(newUser);
    }

    @Test
    void createUser_WithEmptyValidationCode_ShouldGenerateCode() {
        // Arrange
        User newUser = new User();
        newUser.setUsername("user");
        newUser.setPassword("password");
        newUser.setValidationCode(""); // Empty validation code
        
        when(passwordEncoder.encode("password")).thenReturn("encodedPassword");
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        User result = userService.createUser(newUser);

        // Assert
        assertNotNull(result.getValidationCode());
        assertFalse(result.getValidationCode().isEmpty());
        assertNotEquals("", result.getValidationCode());
        verify(userRepository).save(newUser);
    }
}
