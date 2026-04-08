package com.rapidquake.controller;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.FamilyRelation;
import com.rapidquake.model.FamilyRelationStatus;
import com.rapidquake.model.Role;
import com.rapidquake.model.TrappedReport;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.repository.FamilyRelationRepository;
import com.rapidquake.service.DemoUserService;
import com.rapidquake.service.EmergencyService;
import com.rapidquake.service.TrappedReportService;
import com.rapidquake.service.UserAccountService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
public class AdminApiController {

    private final EmergencyService emergencyService;
    private final TrappedReportService trappedReportService;
    private final DemoUserService demoUserService;
    private final AppUserRepository appUserRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final UserAccountService userAccountService;

    public AdminApiController(EmergencyService emergencyService,
                              TrappedReportService trappedReportService,
                              DemoUserService demoUserService,
                              AppUserRepository appUserRepository,
                              FamilyRelationRepository familyRelationRepository,
                              UserAccountService userAccountService) {
        this.emergencyService = emergencyService;
        this.trappedReportService = trappedReportService;
        this.demoUserService = demoUserService;
        this.appUserRepository = appUserRepository;
        this.familyRelationRepository = familyRelationRepository;
        this.userAccountService = userAccountService;
    }

    @PostMapping("/emergency/activate")
    public ResponseEntity<Map<String, Object>> activate() {
        trappedReportService.clearAll();
        emergencyService.activate();
        return ResponseEntity.ok(Map.of("active", true));
    }

    @PostMapping("/emergency/deactivate")
    public ResponseEntity<Map<String, Object>> deactivate() {
        emergencyService.deactivate();
        return ResponseEntity.ok(Map.of("active", false));
    }

    @PostMapping("/demo-users")
    public ResponseEntity<Map<String, Object>> createDemoUser(@RequestBody Map<String, Object> body) {
        try {
            String email = (String) body.get("email");
            String fullName = (String) body.get("fullName");
            String password = (String) body.get("password");
            String city = body.get("city") != null ? String.valueOf(body.get("city")) : "";
            String phone = body.get("phone") != null ? String.valueOf(body.get("phone")) : null;
            Object latObj = body.get("latitude");
            Object lonObj = body.get("longitude");
            if (email == null || fullName == null || password == null || latObj == null || lonObj == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "email, fullName, password, latitude, longitude are required"));
            }
            double lat = ((Number) latObj).doubleValue();
            double lon = ((Number) lonObj).doubleValue();
            AppUser created = demoUserService.createDemoUserAtLocation(email, fullName, password, city, phone, lat, lon);
            return ResponseEntity.ok(Map.of(
                    "ok", true,
                    "email", created.getEmail(),
                    "latitude", created.getLastLatitude(),
                    "longitude", created.getLastLongitude()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not create user"));
        }
    }

    @GetMapping("/trapped")
    public ResponseEntity<List<Map<String, Object>>> listTrapped() {
        List<Map<String, Object>> list = trappedReportService.findAll().stream()
                .map(this::toDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/users")
    public ResponseEntity<List<Map<String, Object>>> listUsers(@RequestParam(name = "name", defaultValue = "") String name) {
        List<Map<String, Object>> list = appUserRepository.findByRoleAndFullNameContainingIgnoreCase(Role.USER, name.trim()).stream()
                .map(this::toUserDto)
                .collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    @GetMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> userDetails(@PathVariable Long id) {
        return appUserRepository.findByIdAndRole(id, Role.USER)
                .map(u -> ResponseEntity.ok(toUserDto(u)))
                .orElseGet(() -> ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found")));
    }

    @PutMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> updateUser(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        AppUser user = appUserRepository.findByIdAndRole(id, Role.USER).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        String fullName = body.get("fullName") != null ? String.valueOf(body.get("fullName")).trim() : "";
        if (fullName.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Full name is required"));
        }
        user.setFullName(fullName);
        user.setCity(body.get("city") != null ? String.valueOf(body.get("city")).trim() : "");
        String phone = body.get("phone") != null ? String.valueOf(body.get("phone")).trim() : "";
        user.setPhone(phone.isBlank() ? null : phone);
        appUserRepository.save(user);
        return ResponseEntity.ok(toUserDto(user));
    }

    @PostMapping("/users/{id}/deactivate")
    public ResponseEntity<Map<String, Object>> deactivateUser(@PathVariable Long id) {
        AppUser user = appUserRepository.findByIdAndRole(id, Role.USER).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        user.setActive(false);
        appUserRepository.save(user);
        return ResponseEntity.ok(toUserDto(user));
    }

    @PostMapping("/users/{id}/activate")
    public ResponseEntity<Map<String, Object>> activateUser(@PathVariable Long id) {
        AppUser user = appUserRepository.findByIdAndRole(id, Role.USER).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        user.setActive(true);
        appUserRepository.save(user);
        return ResponseEntity.ok(toUserDto(user));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Map<String, Object>> deleteUser(@PathVariable Long id) {
        AppUser user = appUserRepository.findByIdAndRole(id, Role.USER).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "User not found"));
        }
        try {
            userAccountService.deleteAccount(user.getId());
            return ResponseEntity.ok(Map.of("ok", true));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Could not delete user"));
        }
    }

    /** Remove one user from the trapped list (rescued / cleared by admin). */
    @PostMapping("/trapped/rescue/{userId}")
    public ResponseEntity<Map<String, Object>> rescueTrappedUser(@PathVariable Long userId) {
        if (trappedReportService.rescueByUserId(userId)) {
            return ResponseEntity.ok(Map.of("ok", true));
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "No trapped report for this user"));
    }

    private Map<String, Object> toDto(TrappedReport r) {
        Map<String, Object> m = new HashMap<>();
        m.put("id", r.getId());
        m.put("latitude", r.getLatitude());
        m.put("longitude", r.getLongitude());
        m.put("accuracyMeters", r.getAccuracyMeters());
        m.put("reportedAt", r.getReportedAt().toString());
        m.put("userId", r.getUser().getId());
        m.put("userName", r.getUser().getFullName());
        m.put("userEmail", r.getUser().getEmail());
        m.put("userPhone", r.getUser().getPhone());
        m.put("userCity", r.getUser().getCity());
        return m;
    }

    private Map<String, Object> toUserDto(AppUser u) {
        Map<String, Object> m = new HashMap<>();
        boolean locationVisibleToAdmin = trappedReportService.findByUser(u).isPresent();
        m.put("id", u.getId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("city", u.getCity());
        m.put("phone", u.getPhone());
        m.put("profilePhotoPath", u.getProfilePhotoPath());
        m.put("active", !Boolean.FALSE.equals(u.getActive()));
        m.put("locationVisibleToAdmin", locationVisibleToAdmin);
        m.put("locationPrivacyMessage",
                locationVisibleToAdmin
                        ? "Location is visible while the user is currently marked as trapped."
                        : "Privacy mode: live location is hidden from admin unless the user is trapped.");
        m.put("lastLatitude", locationVisibleToAdmin ? u.getLastLatitude() : null);
        m.put("lastLongitude", locationVisibleToAdmin ? u.getLastLongitude() : null);
        m.put("lastAccuracyMeters", locationVisibleToAdmin ? u.getLastAccuracyMeters() : null);
        m.put("lastLocationAt", locationVisibleToAdmin && u.getLastLocationAt() != null ? u.getLastLocationAt().toString() : null);
        m.put("locationSourceNote", locationVisibleToAdmin ? u.getLocationSourceNote() : null);
        m.put("createdAt", u.getCreatedAt() != null ? u.getCreatedAt().toString() : null);
        m.put("familyMembers", familyMemberSummary(u.getId()));
        return m;
    }

    private List<Map<String, Object>> familyMemberSummary(Long userId) {
        if (userId == null) {
            return List.of();
        }
        List<FamilyRelation> relations = familyRelationRepository.findByRequester_IdOrTarget_Id(userId, userId);
        return relations.stream()
                .filter(r -> r.getStatus() == FamilyRelationStatus.ACCEPTED)
                .map(r -> {
                    AppUser other = r.getRequester().getId().equals(userId) ? r.getTarget() : r.getRequester();
                    Map<String, Object> item = new HashMap<>();
                    item.put("id", other.getId());
                    item.put("fullName", other.getFullName());
                    item.put("email", other.getEmail());
                    item.put("phone", other.getPhone());
                    return item;
                })
                .collect(Collectors.toList());
    }
}
