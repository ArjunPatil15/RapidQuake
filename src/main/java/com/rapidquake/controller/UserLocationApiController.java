package com.rapidquake.controller;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.service.GeoIpService;
import com.rapidquake.service.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserLocationApiController {

    private final AppUserRepository appUserRepository;
    private final UserAccountService userAccountService;
    private final GeoIpService geoIpService;

    public UserLocationApiController(AppUserRepository appUserRepository,
                                     UserAccountService userAccountService,
                                     GeoIpService geoIpService) {
        this.appUserRepository = appUserRepository;
        this.userAccountService = userAccountService;
        this.geoIpService = geoIpService;
    }

    /**
     * Approximate location when the browser blocks GPS — uses server-side IP geolocation.
     */
    @GetMapping("/location-hint")
    public ResponseEntity<Map<String, Object>> locationHint(
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest request) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        AppUser user = appUserRepository.findByEmail(principal.getUsername()).orElse(null);
        if (user == null || user.getRole() != Role.USER) {
            return ResponseEntity.status(403).build();
        }
        if (user.getLastLatitude() != null && user.getLastLongitude() != null) {
            Map<String, Object> m = new HashMap<>();
            m.put("latitude", user.getLastLatitude());
            m.put("longitude", user.getLastLongitude());
            m.put("accuracyMeters", user.getLastAccuracyMeters() != null ? user.getLastAccuracyMeters() : 5000.0);
            m.put("source", "saved");
            m.put("note", user.getLocationSourceNote());
            return ResponseEntity.ok(m);
        }
        return geoIpService.lookup(geoIpService.resolveClientIp(request))
                .map(g -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("latitude", g.latitude());
                    m.put("longitude", g.longitude());
                    m.put("accuracyMeters", 5000);
                    m.put("source", "ip");
                    m.put("note", g.note());
                    return ResponseEntity.ok(m);
                })
                .orElse(ResponseEntity.noContent().build());
    }

    @PostMapping("/location")
    public ResponseEntity<Void> updateLocation(
            @AuthenticationPrincipal UserDetails principal,
            @RequestBody Map<String, Object> body) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        AppUser user = appUserRepository.findByEmail(principal.getUsername()).orElse(null);
        if (user == null || user.getRole() != com.rapidquake.model.Role.USER) {
            return ResponseEntity.status(403).build();
        }
        Object latObj = body.get("latitude");
        Object lonObj = body.get("longitude");
        if (latObj == null || lonObj == null) {
            return ResponseEntity.badRequest().build();
        }
        double lat = ((Number) latObj).doubleValue();
        double lon = ((Number) lonObj).doubleValue();
        Double acc = body.get("accuracyMeters") instanceof Number n ? n.doubleValue() : null;
        userAccountService.updateLastLocation(user, lat, lon, acc);
        return ResponseEntity.ok().build();
    }
}
