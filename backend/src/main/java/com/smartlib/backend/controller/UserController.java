package com.smartlib.backend.controller;

import com.smartlib.backend.dto.UserCreateRequest;
import com.smartlib.backend.entity.User;
import com.smartlib.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public List<User> list() {
        return userService.findAll();
    }

    @PostMapping
    public User create(@Valid @RequestBody UserCreateRequest req) {
        return userService.create(req);
    }
}
