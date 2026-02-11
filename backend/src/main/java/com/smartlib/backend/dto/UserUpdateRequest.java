package com.smartlib.backend.dto;

import com.smartlib.backend.entity.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

public class UserUpdateRequest {
    @Size(min = 3, max = 50)
    private String username;

    @Email
    private String email;

    @Size(min = 6, max = 100)
    private String password;

    private Role role;

    public String getUsername() { return username; }
    public void setUsername(String username) { this.username = username; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
}
