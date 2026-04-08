package com.rapidquake.config;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final AppUserRepository appUserRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${rapidquake.admin.email:admin@rapidquake.local}")
    private String adminEmail;

    @Value("${rapidquake.admin.password:admin123}")
    private String adminPassword;

    @Value("${rapidquake.seed.admin.enabled:true}")
    private boolean seedAdminEnabled;

    public DataInitializer(AppUserRepository appUserRepository, PasswordEncoder passwordEncoder) {
        this.appUserRepository = appUserRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        if (!seedAdminEnabled) {
            log.info("Admin seeding disabled (rapidquake.seed.admin.enabled=false)");
            return;
        }
        String email = adminEmail.trim().toLowerCase();
        if (appUserRepository.findByEmail(email).isEmpty()) {
            AppUser admin = new AppUser();
            admin.setEmail(email);
            admin.setPasswordHash(passwordEncoder.encode(adminPassword));
            admin.setFullName("System Administrator");
            admin.setCity("—");
            admin.setRole(Role.ADMIN);
            admin.setActive(true);
            appUserRepository.save(admin);
            log.info("Created default admin user: {}", email);
        }
    }
}
