package com.rapidquake.service;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.repository.FamilyRelationRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;

@Service
public class UserAccountService {

    private final AppUserRepository appUserRepository;
    private final FamilyRelationRepository familyRelationRepository;
    private final PasswordEncoder passwordEncoder;
    private final GeoIpService geoIpService;

    @Value("${rapidquake.upload.dir:src/main/resources/static/img/profile}")
    private String uploadDir;

    public UserAccountService(AppUserRepository appUserRepository,
                              FamilyRelationRepository familyRelationRepository,
                              PasswordEncoder passwordEncoder,
                              GeoIpService geoIpService) {
        this.appUserRepository = appUserRepository;
        this.familyRelationRepository = familyRelationRepository;
        this.passwordEncoder = passwordEncoder;
        this.geoIpService = geoIpService;
    }

    @Transactional
    public AppUser register(String fullName, String email, String city, String phone, String password,
                            MultipartFile photo,
                            Double regLat, Double regLon, Double regAccuracy,
                            HttpServletRequest request) throws IOException {
        if (appUserRepository.existsByEmail(email.trim().toLowerCase())) {
            throw new IllegalArgumentException("Email is already registered.");
        }
        AppUser u = new AppUser();
        u.setEmail(email.trim().toLowerCase());
        u.setFullName(fullName.trim());
        u.setCity(city != null ? city.trim() : "");
        u.setPhone(phone != null ? phone.trim() : null);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setRole(Role.USER);
        u.setActive(true);

        if (regLat != null && regLon != null) {
            u.setLastLatitude(regLat);
            u.setLastLongitude(regLon);
            u.setLastAccuracyMeters(regAccuracy);
            u.setLastLocationAt(java.time.Instant.now());
            u.setLocationSourceNote("Device (registration)");
        } else {
            String clientIp = geoIpService.resolveClientIp(request);
            Optional<GeoIpService.GeoResult> geo = geoIpService.lookup(clientIp);
            if (geo.isPresent()) {
                u.setLastLatitude(geo.get().latitude());
                u.setLastLongitude(geo.get().longitude());
                u.setLastAccuracyMeters(5000.0);
                u.setLastLocationAt(java.time.Instant.now());
                u.setLocationSourceNote(geo.get().note());
            }
        }

        if (photo != null && !photo.isEmpty()) {
            Path dir = resolvedUploadDirBase();
            Files.createDirectories(dir);
            String ext = Optional.ofNullable(photo.getOriginalFilename())
                    .filter(f -> f.contains("."))
                    .map(f -> f.substring(f.lastIndexOf('.')))
                    .orElse(".jpg");
            String filename = UUID.randomUUID() + ext;
            Path target = dir.resolve(filename);
            Files.write(target, photo.getBytes());
            u.setProfilePhotoPath("/img/profile/" + filename);
        }

        return appUserRepository.save(u);
    }

    private Path resolvedUploadDirBase() {
        Path dir = Paths.get(uploadDir);
        if (!dir.isAbsolute()) {
            dir = Paths.get(System.getProperty("user.dir")).resolve(uploadDir).normalize();
        }
        return dir;
    }

    private void deleteProfilePhotoFile(String profilePhotoPath) {
        if (profilePhotoPath == null || !profilePhotoPath.startsWith("/img/profile/")) {
            return;
        }
        String filename = profilePhotoPath.substring("/img/profile/".length());
        if (filename.isEmpty() || filename.contains("..")) {
            return;
        }
        try {
            Files.deleteIfExists(resolvedUploadDirBase().resolve(filename));
        } catch (IOException ignored) {
        }
    }

    @Transactional
    public void updateProfile(Long userId, String fullName, String city, String phone,
                              String newPassword, boolean changePassword,
                              MultipartFile photo, boolean removePhoto) throws IOException {
        AppUser user = appUserRepository.findById(Objects.requireNonNull(userId, "User id is required"))
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (fullName != null && !fullName.isBlank()) {
            user.setFullName(fullName.trim());
        }
        user.setCity(city != null ? city.trim() : "");
        user.setPhone(phone != null && !phone.isBlank() ? phone.trim() : null);
        if (changePassword && newPassword != null && !newPassword.isBlank()) {
            if (newPassword.length() < 8) {
                throw new IllegalArgumentException("Password must be at least 8 characters.");
            }
            user.setPasswordHash(passwordEncoder.encode(newPassword));
        }
        if (removePhoto && user.getProfilePhotoPath() != null) {
            deleteProfilePhotoFile(user.getProfilePhotoPath());
            user.setProfilePhotoPath(null);
        }
        if (photo != null && !photo.isEmpty()) {
            deleteProfilePhotoFile(user.getProfilePhotoPath());
            Path dir = resolvedUploadDirBase();
            Files.createDirectories(dir);
            String ext = Optional.ofNullable(photo.getOriginalFilename())
                    .filter(f -> f.contains("."))
                    .map(f -> f.substring(f.lastIndexOf('.')))
                    .orElse(".jpg");
            String filename = UUID.randomUUID() + ext;
            Files.write(dir.resolve(filename), photo.getBytes());
            user.setProfilePhotoPath("/img/profile/" + filename);
        }
        appUserRepository.save(user);
    }

    @Transactional
    public void deleteAccount(Long userId) throws IOException {
        AppUser user = appUserRepository.findById(Objects.requireNonNull(userId, "User id is required"))
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        familyRelationRepository.deleteByRequester_IdOrTarget_Id(user.getId(), user.getId());
        deleteProfilePhotoFile(user.getProfilePhotoPath());
        appUserRepository.delete(user);
    }

    @Transactional
    public void updateLastLocation(AppUser user, double lat, double lon, Double accuracyMeters) {
        user.setLastLatitude(lat);
        user.setLastLongitude(lon);
        user.setLastAccuracyMeters(accuracyMeters);
        user.setLastLocationAt(java.time.Instant.now());
        user.setLocationSourceNote("Device (session)");
        appUserRepository.save(user);
    }
}
