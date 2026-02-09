package com.smartlib.backend.controller;

import com.smartlib.backend.dto.SearchRequest;
import com.smartlib.backend.service.AiSearchService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/search")
public class SearchController {
    private final AiSearchService aiSearchService;

    public SearchController(AiSearchService aiSearchService) {
        this.aiSearchService = aiSearchService;
    }

    @PostMapping
    public List<?> search(@Valid @RequestBody SearchRequest req) {
        return aiSearchService.search(req);
    }
}
