package com.rapidquake.repository;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.TrappedReport;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TrappedReportRepository extends JpaRepository<TrappedReport, Long> {
    Optional<TrappedReport> findByUser(AppUser user);

    void deleteByUser(AppUser user);

    /** Returns number of rows removed (0 if user was not on the trapped list). */
    int deleteByUser_Id(Long userId);

    List<TrappedReport> findByUser_IdIn(List<Long> userIds);
}
