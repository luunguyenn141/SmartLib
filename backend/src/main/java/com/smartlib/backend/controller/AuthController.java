package com.smartlib.backend.controller;

import com.smartlib.backend.dto.AuthRequest;
import com.smartlib.backend.dto.AuthResponse;
import com.smartlib.backend.dto.UserCreateRequest;
import com.smartlib.backend.entity.User;
import com.smartlib.backend.repository.UserRepository;
import com.smartlib.backend.security.JwtService;
import com.smartlib.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final UserService userService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserService userService, UserRepository userRepository,
                          PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userService = userService;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @PostMapping("/register")
    public AuthResponse register(@Valid @RequestBody UserCreateRequest req) {
        User user = userService.create(req);
        String token = jwtService.generateToken(user.getUsername(), Map.of("role", user.getRole().name()));
        return new AuthResponse(token);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AuthRequest req) {
        User user = userRepository.findByUsername(req.getUsername()).orElse(null);
        if (user == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            return ResponseEntity.status(401).build();
        }
        String token = jwtService.generateToken(user.getUsername(), Map.of("role", user.getRole().name()));
        return ResponseEntity.ok(new AuthResponse(token));
    }
}
