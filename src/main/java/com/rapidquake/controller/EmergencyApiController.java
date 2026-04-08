package com.rapidquake.controller;

import com.rapidquake.service.EmergencyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
public class EmergencyApiController {

    private final EmergencyService emergencyService;

    public EmergencyApiController(EmergencyService emergencyService) {
        this.emergencyService = emergencyService;
    }

    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        return ResponseEntity.ok(Map.of(
                "active", emergencyService.isActive(),
                "since", emergencyService.getStartedAt() != null ? emergencyService.getStartedAt().toString() : ""
        ));
    }
}
