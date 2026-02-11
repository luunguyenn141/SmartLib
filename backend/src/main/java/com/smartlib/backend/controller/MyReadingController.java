package com.smartlib.backend.controller;

import com.smartlib.backend.dto.*;
import com.smartlib.backend.entity.ReadingStatus;
import com.smartlib.backend.entity.User;
import com.smartlib.backend.service.MyReadingService;
import com.smartlib.backend.service.UserService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/my")
public class MyReadingController {
    private final MyReadingService myReadingService;
    private final UserService userService;

    public MyReadingController(MyReadingService myReadingService, UserService userService) {
        this.myReadingService = myReadingService;
        this.userService = userService;
    }

    @GetMapping("/books")
    public List<MyBookResponse> listMyBooks(
            Principal principal,
            @RequestParam(required = false) ReadingStatus status
    ) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.listMyBooks(user, status);
    }

    @PostMapping("/books")
    public MyBookResponse addMyBook(Principal principal, @Valid @RequestBody MyBookCreateRequest req) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.addMyBook(user, req);
    }

    @PatchMapping("/books/{id}")
    public MyBookResponse updateMyBook(
            Principal principal,
            @PathVariable Long id,
            @Valid @RequestBody MyBookUpdateRequest req
    ) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.updateMyBook(user, id, req);
    }

    @DeleteMapping("/books/{id}")
    public void deleteMyBook(Principal principal, @PathVariable Long id) {
        User user = userService.findByUsername(principal.getName());
        myReadingService.deleteMyBook(user, id);
    }

    @GetMapping("/sessions")
    public List<ReadingSessionResponse> listSessions(
            Principal principal,
            @RequestParam(required = false) String from,
            @RequestParam(required = false) String to
    ) {
        User user = userService.findByUsername(principal.getName());
        LocalDate fromDate = from == null || from.isBlank() ? null : LocalDate.parse(from);
        LocalDate toDate = to == null || to.isBlank() ? null : LocalDate.parse(to);
        return myReadingService.listSessions(user, fromDate, toDate);
    }

    @PostMapping("/sessions")
    public ReadingSessionResponse createSession(
            Principal principal,
            @Valid @RequestBody ReadingSessionCreateRequest req
    ) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.createSession(user, req);
    }

    @GetMapping("/goals")
    public UserGoalResponse getGoals(Principal principal) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.getGoals(user);
    }

    @PutMapping("/goals")
    public UserGoalResponse updateGoals(
            Principal principal,
            @Valid @RequestBody UserGoalUpdateRequest req
    ) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.updateGoals(user, req);
    }

    @GetMapping("/dashboard")
    public MyDashboardResponse getDashboard(Principal principal) {
        User user = userService.findByUsername(principal.getName());
        return myReadingService.getDashboard(user);
    }
}
