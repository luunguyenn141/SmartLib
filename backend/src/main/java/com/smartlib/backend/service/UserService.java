package com.smartlib.backend.service;

import com.smartlib.backend.dto.UserCreateRequest;
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
}
