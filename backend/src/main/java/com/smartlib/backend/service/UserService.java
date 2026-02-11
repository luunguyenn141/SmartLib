package com.smartlib.backend.service;

import com.smartlib.backend.dto.UserCreateRequest;
import com.smartlib.backend.dto.UserUpdateRequest;
import com.smartlib.backend.entity.Role;
import com.smartlib.backend.entity.User;
import com.smartlib.backend.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> findAll() {
        return userRepository.findAll();
    }

    public User findById(Long id) {
        return userRepository.findById(id).orElseThrow();
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElseThrow();
    }

    public User create(UserCreateRequest req) {
        userRepository.findByUsername(req.getUsername()).ifPresent(u -> {
            throw new IllegalArgumentException("Username already exists");
        });
        userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
            throw new IllegalArgumentException("Email already exists");
        });
        User user = new User();
        user.setUsername(req.getUsername());
        user.setEmail(req.getEmail());
        user.setRole(Role.MEMBER);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        return userRepository.save(user);
    }

    public User update(Long id, UserUpdateRequest req) {
        User user = userRepository.findById(id).orElseThrow();
        if (req.getUsername() != null && !req.getUsername().equals(user.getUsername())) {
            userRepository.findByUsername(req.getUsername()).ifPresent(u -> {
                throw new IllegalArgumentException("Username already exists");
            });
            user.setUsername(req.getUsername());
        }
        if (req.getEmail() != null && !req.getEmail().equals(user.getEmail())) {
            userRepository.findByEmail(req.getEmail()).ifPresent(u -> {
                throw new IllegalArgumentException("Email already exists");
            });
            user.setEmail(req.getEmail());
        }
        if (req.getPassword() != null && !req.getPassword().isBlank()) {
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        }
        if (req.getRole() != null) {
            user.setRole(req.getRole());
        }
        return userRepository.save(user);
    }

    public void delete(Long id) {
        if (!userRepository.existsById(id)) {
            throw new IllegalArgumentException("User not found");
        }
        userRepository.deleteById(id);
    }
}
