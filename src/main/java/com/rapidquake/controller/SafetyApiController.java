package com.rapidquake.controller;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.model.TrappedReport;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.service.EmergencyService;
import com.rapidquake.service.GeoIpService;
import com.rapidquake.service.TrappedReportService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/safety")
public class SafetyApiController {

    private final AppUserRepository appUserRepository;
    private final TrappedReportService trappedReportService;
    private final GeoIpService geoIpService;
    private final EmergencyService emergencyService;

    public SafetyApiController(AppUserRepository appUserRepository,
                               TrappedReportService trappedReportService,
                               GeoIpService geoIpService,
                               EmergencyService emergencyService) {
        this.appUserRepository = appUserRepository;
        this.trappedReportService = trappedReportService;
        this.geoIpService = geoIpService;
        this.emergencyService = emergencyService;
    }

    @PostMapping("/im-safe")
    public ResponseEntity<Void> imSafe(@AuthenticationPrincipal UserDetails principal) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        emergencyService.markUserSafeResponse(user.getId());
        trappedReportService.clearForUser(user);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/me/trapped")
    public ResponseEntity<Map<String, Object>> myTrappedStatus(@AuthenticationPrincipal UserDetails principal) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        TrappedReport report = trappedReportService.findByUser(user).orElse(null);
        if (report == null) {
            return ResponseEntity.ok(Map.of("trapped", false));
        }
        return ResponseEntity.ok(Map.of(
                "trapped", true,
                "latitude", report.getLatitude(),
                "longitude", report.getLongitude(),
                "reportedAt", report.getReportedAt() != null ? report.getReportedAt().toString() : ""
        ));
    }

    @PostMapping("/trapped")
    @Transactional
    public ResponseEntity<Void> reportTrapped(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body,
            HttpServletRequest request) {
        AppUser user = requireUser(principal);
        if (user == null) {
            return ResponseEntity.status(403).build();
        }
        user = appUserRepository.findByEmail(user.getEmail()).orElse(user);

        if (Boolean.TRUE.equals(body.get("fallbackToStored"))) {
            if (user.getLastLatitude() != null && user.getLastLongitude() != null) {
                trappedReportService.reportTrapped(user, user.getLastLatitude(), user.getLastLongitude(),
                        user.getLastAccuracyMeters());
                return ResponseEntity.ok().build();
            }
            Optional<GeoIpService.GeoResult> ipGeo = geoIpService.lookup(geoIpService.resolveClientIp(request));
            if (ipGeo.isPresent()) {
                GeoIpService.GeoResult g = ipGeo.get();
                applyNetworkLocation(user, g.latitude(), g.longitude(), 5000.0, g.note());
                trappedReportService.reportTrapped(user, g.latitude(), g.longitude(), 5000.0);
                return ResponseEntity.ok().build();
            }
            return ResponseEntity.ok().build();
        }

        Object latObj = body.get("latitude");
        Object lonObj = body.get("longitude");
        if (latObj == null || lonObj == null) {
            return ResponseEntity.badRequest().build();
        }
        double lat = ((Number) latObj).doubleValue();
        double lon = ((Number) lonObj).doubleValue();
        Double acc = body.get("accuracyMeters") instanceof Number n ? n.doubleValue() : null;
        trappedReportService.reportTrapped(user, lat, lon, acc);
        return ResponseEntity.ok().build();
    }

    private void applyNetworkLocation(AppUser user, double lat, double lon, double accuracy, String note) {
        user.setLastLatitude(lat);
        user.setLastLongitude(lon);
        user.setLastAccuracyMeters(accuracy);
        user.setLastLocationAt(Instant.now());
        user.setLocationSourceNote(note);
        appUserRepository.save(user);
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
