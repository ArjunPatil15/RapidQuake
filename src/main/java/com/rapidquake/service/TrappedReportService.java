package com.rapidquake.service;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.TrappedReport;
import com.rapidquake.repository.TrappedReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Service
public class TrappedReportService {

    private final TrappedReportRepository trappedReportRepository;

    public TrappedReportService(TrappedReportRepository trappedReportRepository) {
        this.trappedReportRepository = trappedReportRepository;
    }

    @Transactional
    public void reportTrapped(AppUser user, double latitude, double longitude, Double accuracyMeters) {
        TrappedReport r = trappedReportRepository.findByUser(user).orElseGet(TrappedReport::new);
        r.setUser(user);
        r.setLatitude(latitude);
        r.setLongitude(longitude);
        r.setAccuracyMeters(accuracyMeters);
        r.setReportedAt(Instant.now());
        trappedReportRepository.save(r);
    }

    @Transactional
    public void clearForUser(AppUser user) {
        trappedReportRepository.deleteByUser(user);
    }

    @Transactional
    public void clearAll() {
        trappedReportRepository.deleteAll();
    }

    public List<TrappedReport> findAll() {
        return trappedReportRepository.findAll();
    }

    public Optional<TrappedReport> findByUser(AppUser user) {
        return trappedReportRepository.findByUser(user);
    }

    /**
     * Remove a user from the trapped list (admin marks them rescued).
     *
     * @return true if a trapped report existed and was deleted
     */
    @Transactional
    public boolean rescueByUserId(Long userId) {
        if (userId == null) {
            return false;
        }
        return trappedReportRepository.deleteByUser_Id(userId) > 0;
    }
}
