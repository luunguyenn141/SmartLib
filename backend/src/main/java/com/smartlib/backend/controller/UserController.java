package com.smartlib.backend.controller;

import com.smartlib.backend.entity.User;
import com.smartlib.backend.service.UserService;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public User me(Principal principal) {
        return userService.findByUsername(principal.getName());
    }
}
