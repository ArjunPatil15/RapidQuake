package com.rapidquake.service;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import org.springframework.stereotype.Service;
import org.springframework.scheduling.annotation.Scheduled;

import java.time.Instant;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;

@Service
public class EmergencyService {

    public static final int EMERGENCY_RESPONSE_SECONDS = 20;

    private final AtomicBoolean active = new AtomicBoolean(false);
    private final AtomicBoolean sweepDoneForActivation = new AtomicBoolean(false);
    private final Set<Long> safeResponders = ConcurrentHashMap.newKeySet();
    private final AppUserRepository appUserRepository;
    private final TrappedReportService trappedReportService;
    private volatile Instant startedAt;

    public EmergencyService(AppUserRepository appUserRepository,
                            TrappedReportService trappedReportService) {
        this.appUserRepository = appUserRepository;
        this.trappedReportService = trappedReportService;
    }

    public void activate() {
        active.set(true);
        startedAt = Instant.now();
        sweepDoneForActivation.set(false);
        safeResponders.clear();
    }

    public void deactivate() {
        active.set(false);
        startedAt = null;
        sweepDoneForActivation.set(false);
        safeResponders.clear();
    }

    public boolean isActive() {
        return active.get();
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public void markUserSafeResponse(Long userId) {
        if (userId != null) {
            safeResponders.add(userId);
        }
    }

    /**
     * Global emergency enforcement:
     * after the 20s response window, mark non-responding users as trapped
     * using their latest known location (if available).
     */
    @Scheduled(fixedDelay = 4000)
    public void enforceGlobalEmergencyWindow() {
        if (!active.get() || startedAt == null || sweepDoneForActivation.get()) {
            return;
        }
        long elapsed = Instant.now().toEpochMilli() - startedAt.toEpochMilli();
        if (elapsed < EMERGENCY_RESPONSE_SECONDS * 1000L) {
            return;
        }
        for (AppUser user : appUserRepository.findAll()) {
            if (user.getRole() != Role.USER || Boolean.FALSE.equals(user.getActive())) {
                continue;
            }
            if (safeResponders.contains(user.getId())) {
                continue;
            }
            if (user.getLastLatitude() == null || user.getLastLongitude() == null) {
                continue;
            }
            trappedReportService.reportTrapped(user, user.getLastLatitude(), user.getLastLongitude(), user.getLastAccuracyMeters());
        }
        sweepDoneForActivation.set(true);
    }
}
