package com.smartlib.backend.service;

import com.smartlib.backend.dto.SearchRequest;
import com.smartlib.backend.dto.SearchResult;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.List;

@Service
public class AiSearchService {
    private final RestTemplate restTemplate = new RestTemplate();
    private final String baseUrl;

    public AiSearchService(@Value("${ai.service.base-url}") String baseUrl) {
        this.baseUrl = baseUrl;
    }

    public List<SearchResult> search(SearchRequest req) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<SearchRequest> entity = new HttpEntity<>(req, headers);
        return restTemplate.exchange(
                baseUrl + "/search",
                HttpMethod.POST,
                entity,
                new ParameterizedTypeReference<List<SearchResult>>() {}
        ).getBody();
    }
}
