package com.rapidquake.service;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class DemoUserService {

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    public DemoUserService(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Creates an app user with an exact map position — for external demos (admin only).
     */
    @Transactional
    public AppUser createDemoUserAtLocation(String email,
                                            String fullName,
                                            String rawPassword,
                                            String city,
                                            String phone,
                                            double latitude,
                                            double longitude) {
        String normalized = email.trim().toLowerCase();
        if (appUserRepository.existsByEmail(normalized)) {
            throw new IllegalArgumentException("That email is already registered.");
        }
        if (rawPassword == null || rawPassword.length() < 8) {
            throw new IllegalArgumentException("Password must be at least 8 characters.");
        }
        if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
            throw new IllegalArgumentException("Invalid coordinates.");
        }
        AppUser u = new AppUser();
        u.setEmail(normalized);
        u.setFullName(fullName.trim());
        u.setCity(city != null ? city.trim() : "");
        u.setPhone(phone != null && !phone.isBlank() ? phone.trim() : null);
        u.setPasswordHash(passwordEncoder.encode(rawPassword));
        u.setRole(Role.USER);
        u.setActive(true);
        u.setLastLatitude(latitude);
        u.setLastLongitude(longitude);
        u.setLastAccuracyMeters(50.0);
        u.setLastLocationAt(Instant.now());
        u.setLocationSourceNote("Demo placement (admin)");
        return appUserRepository.save(u);
    }
}
