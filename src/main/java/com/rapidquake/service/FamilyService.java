package com.rapidquake.service;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.FamilyRelation;
import com.rapidquake.model.FamilyRelationStatus;
import com.rapidquake.model.Role;
import com.rapidquake.model.TrappedReport;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.repository.FamilyRelationRepository;
import com.rapidquake.repository.TrappedReportRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.Objects;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class FamilyService {
    private final FamilyRelationRepository familyRelationRepository;
    private final AppUserRepository appUserRepository;
    private final TrappedReportRepository trappedReportRepository;
    private final TrappedReportService trappedReportService;

    public FamilyService(FamilyRelationRepository familyRelationRepository,
                         AppUserRepository appUserRepository,
                         TrappedReportRepository trappedReportRepository,
                         TrappedReportService trappedReportService) {
        this.familyRelationRepository = familyRelationRepository;
        this.appUserRepository = appUserRepository;
        this.trappedReportRepository = trappedReportRepository;
        this.trappedReportService = trappedReportService;
    }

    @Transactional
    public void sendRequest(AppUser requester, String targetEmail) {
        String email = targetEmail == null ? "" : targetEmail.trim();
        AppUser target = appUserRepository.findByEmailIgnoreCase(email)
                .filter(u -> u.getRole() == Role.USER)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        if (requester.getId().equals(target.getId())) {
            throw new IllegalArgumentException("You cannot add yourself.");
        }
        if (hasAcceptedConnection(requester.getId(), target.getId())) {
            throw new IllegalArgumentException("Already connected as family.");
        }
        Optional<FamilyRelation> reversePending = familyRelationRepository
                .findByRequester_IdAndTarget_IdAndStatus(target.getId(), requester.getId(), FamilyRelationStatus.PENDING);
        if (reversePending.isPresent()) {
            FamilyRelation relation = reversePending.get();
            relation.setStatus(FamilyRelationStatus.ACCEPTED);
            relation.setAcceptedAt(Instant.now());
            familyRelationRepository.save(relation);
            return;
        }
        if (hasPendingConnection(requester.getId(), target.getId())) {
            throw new IllegalArgumentException("A pending request already exists.");
        }
        FamilyRelation relation = new FamilyRelation();
        relation.setRequester(requester);
        relation.setTarget(target);
        relation.setStatus(FamilyRelationStatus.PENDING);
        familyRelationRepository.save(relation);
    }

    @Transactional
    public void acceptRequest(AppUser currentUser, Long relationId) {
        FamilyRelation relation = familyRelationRepository.findByIdAndTarget_Id(relationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Request not found."));
        relation.setStatus(FamilyRelationStatus.ACCEPTED);
        relation.setAcceptedAt(Instant.now());
        familyRelationRepository.save(relation);
    }

    @Transactional
    public void rejectRequest(AppUser currentUser, Long relationId) {
        FamilyRelation relation = familyRelationRepository.findByIdAndTarget_Id(relationId, currentUser.getId())
                .orElseThrow(() -> new IllegalArgumentException("Request not found."));
        familyRelationRepository.delete(Objects.requireNonNull(relation));
    }

    @Transactional
    public void removeFamilyMember(AppUser currentUser, Long otherUserId) {
        Optional<FamilyRelation> direct = familyRelationRepository
                .findByRequester_IdAndTarget_IdAndStatus(currentUser.getId(), otherUserId, FamilyRelationStatus.ACCEPTED);
        Optional<FamilyRelation> reverse = familyRelationRepository
                .findByRequester_IdAndTarget_IdAndStatus(otherUserId, currentUser.getId(), FamilyRelationStatus.ACCEPTED);
        FamilyRelation relation = direct.orElse(null);
        if (relation == null) {
            relation = reverse.orElseThrow(NoSuchElementException::new);
        }
        familyRelationRepository.delete(Objects.requireNonNull(relation));
    }

    public boolean canManageTrapped(AppUser actingUser, Long trappedUserId) {
        return hasAcceptedConnection(actingUser.getId(), trappedUserId);
    }

    @Transactional
    public boolean markFamilyMemberSafe(AppUser actingUser, Long trappedUserId) {
        if (!canManageTrapped(actingUser, trappedUserId)) {
            return false;
        }
        return trappedReportService.rescueByUserId(trappedUserId);
    }

    public Map<String, Object> overview(AppUser currentUser) {
        List<FamilyRelation> outgoing = familyRelationRepository
                .findByRequester_IdAndStatus(currentUser.getId(), FamilyRelationStatus.PENDING);
        List<FamilyRelation> incoming = familyRelationRepository
                .findByTarget_IdAndStatus(currentUser.getId(), FamilyRelationStatus.PENDING);

        List<FamilyRelation> acceptedByRequester = familyRelationRepository
                .findByRequester_IdAndStatus(currentUser.getId(), FamilyRelationStatus.ACCEPTED);
        List<FamilyRelation> acceptedByTarget = familyRelationRepository
                .findByTarget_IdAndStatus(currentUser.getId(), FamilyRelationStatus.ACCEPTED);

        List<AppUser> familyMembers = new ArrayList<>();
        acceptedByRequester.forEach(r -> familyMembers.add(r.getTarget()));
        acceptedByTarget.forEach(r -> familyMembers.add(r.getRequester()));

        Set<Long> uniqueIds = familyMembers.stream().map(AppUser::getId).collect(Collectors.toSet());
        List<TrappedReport> trappedReports = uniqueIds.isEmpty()
                ? List.of()
                : trappedReportRepository.findByUser_IdIn(new ArrayList<>(uniqueIds));

        Map<Long, TrappedReport> trappedByUserId = trappedReports.stream()
                .collect(Collectors.toMap(r -> r.getUser().getId(), r -> r));

        List<Map<String, Object>> family = familyMembers.stream()
                .map(u -> toUserDto(u, trappedByUserId.get(u.getId())))
                .collect(Collectors.toList());

        Map<String, Object> result = new HashMap<>();
        result.put("family", family);
        result.put("incoming", incoming.stream().map(this::toRequestDto).collect(Collectors.toList()));
        result.put("outgoing", outgoing.stream().map(this::toRequestDto).collect(Collectors.toList()));
        return result;
    }

    private Map<String, Object> toRequestDto(FamilyRelation relation) {
        AppUser requester = relation.getRequester();
        AppUser target = relation.getTarget();
        Map<String, Object> m = new HashMap<>();
        m.put("id", relation.getId());
        m.put("requesterId", requester.getId());
        m.put("requesterName", requester.getFullName());
        m.put("requesterEmail", requester.getEmail());
        m.put("targetId", target.getId());
        m.put("targetName", target.getFullName());
        m.put("targetEmail", target.getEmail());
        m.put("createdAt", relation.getCreatedAt().toString());
        return m;
    }

    private Map<String, Object> toUserDto(AppUser u, TrappedReport trappedReport) {
        Map<String, Object> m = new HashMap<>();
        boolean locationVisibleToFamily = trappedReport != null;
        m.put("id", u.getId());
        m.put("fullName", u.getFullName());
        m.put("email", u.getEmail());
        m.put("city", u.getCity());
        m.put("phone", u.getPhone());
        m.put("profilePhotoPath", u.getProfilePhotoPath());
        m.put("locationVisibleToFamily", locationVisibleToFamily);
        m.put("locationPrivacyMessage",
                locationVisibleToFamily
                        ? "Location is visible while this member is marked as trapped."
                        : "Privacy mode: location is hidden unless this member is trapped.");
        m.put("lastLatitude", locationVisibleToFamily ? u.getLastLatitude() : null);
        m.put("lastLongitude", locationVisibleToFamily ? u.getLastLongitude() : null);
        m.put("lastLocationAt", locationVisibleToFamily && u.getLastLocationAt() != null ? u.getLastLocationAt().toString() : null);
        m.put("trapped", trappedReport != null);
        if (trappedReport != null) {
            m.put("trappedLatitude", trappedReport.getLatitude());
            m.put("trappedLongitude", trappedReport.getLongitude());
            m.put("trappedReportedAt", trappedReport.getReportedAt().toString());
        }
        return m;
    }

    private boolean hasAcceptedConnection(Long a, Long b) {
        return familyRelationRepository.findByRequester_IdAndTarget_IdAndStatus(a, b, FamilyRelationStatus.ACCEPTED).isPresent()
                || familyRelationRepository.findByRequester_IdAndTarget_IdAndStatus(b, a, FamilyRelationStatus.ACCEPTED).isPresent();
    }

    private boolean hasPendingConnection(Long a, Long b) {
        return familyRelationRepository.findByRequester_IdAndTarget_IdAndStatus(a, b, FamilyRelationStatus.PENDING).isPresent()
                || familyRelationRepository.findByRequester_IdAndTarget_IdAndStatus(b, a, FamilyRelationStatus.PENDING).isPresent();
    }
}
