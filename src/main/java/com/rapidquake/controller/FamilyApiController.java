package com.rapidquake.controller;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.service.FamilyService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/family")
public class FamilyApiController {
    private final AppUserRepository appUserRepository;
    private final FamilyService familyService;

    public FamilyApiController(AppUserRepository appUserRepository, FamilyService familyService) {
        this.appUserRepository = appUserRepository;
        this.familyService = familyService;
    }

    @GetMapping("/overview")
    public ResponseEntity<?> overview(@AuthenticationPrincipal UserDetails principal) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        return ResponseEntity.ok(familyService.overview(user));
    }

    @PostMapping("/request")
    public ResponseEntity<?> request(@AuthenticationPrincipal UserDetails principal, @RequestBody Map<String, Object> body) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        try {
            String email = body.get("email") != null ? String.valueOf(body.get("email")) : "";
            familyService.sendRequest(user, email);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{relationId}/accept")
    public ResponseEntity<?> accept(@AuthenticationPrincipal UserDetails principal, @PathVariable Long relationId) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        try {
            familyService.acceptRequest(user, relationId);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/request/{relationId}/reject")
    public ResponseEntity<?> reject(@AuthenticationPrincipal UserDetails principal, @PathVariable Long relationId) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        try {
            familyService.rejectRequest(user, relationId);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/member/{userId}")
    public ResponseEntity<?> remove(@AuthenticationPrincipal UserDetails principal, @PathVariable Long userId) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        try {
            familyService.removeFamilyMember(user, userId);
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Could not remove family member"));
        }
    }

    @PostMapping("/trapped/{userId}/mark-safe")
    public ResponseEntity<?> markSafe(@AuthenticationPrincipal UserDetails principal, @PathVariable Long userId) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        if (!familyService.markFamilyMemberSafe(user, userId)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Not allowed or user is not trapped."));
        }
        return ResponseEntity.ok(Map.of("ok", true));
    }

    private AppUser requireUser(UserDetails principal) {
        if (principal == null) {
            return null;
        }
        return appUserRepository.findByEmailIgnoreCase(principal.getUsername())
                .filter(u -> u.getRole() == Role.USER)
                .orElse(null);
    }
}
