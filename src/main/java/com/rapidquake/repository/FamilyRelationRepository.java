package com.rapidquake.repository;

import com.rapidquake.model.FamilyRelation;
import com.rapidquake.model.FamilyRelationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FamilyRelationRepository extends JpaRepository<FamilyRelation, Long> {
    List<FamilyRelation> findByRequester_IdAndStatus(Long requesterId, FamilyRelationStatus status);
    List<FamilyRelation> findByTarget_IdAndStatus(Long targetId, FamilyRelationStatus status);
    Optional<FamilyRelation> findByIdAndTarget_Id(Long id, Long targetUserId);
    Optional<FamilyRelation> findByIdAndRequester_Id(Long id, Long requesterId);
    Optional<FamilyRelation> findByRequester_IdAndTarget_Id(Long requesterId, Long targetId);
    Optional<FamilyRelation> findByRequester_IdAndTarget_IdAndStatus(Long requesterId, Long targetId, FamilyRelationStatus status);
    List<FamilyRelation> findByRequester_IdOrTarget_Id(Long requesterId, Long targetId);
    int deleteByRequester_IdOrTarget_Id(Long requesterId, Long targetId);
}
