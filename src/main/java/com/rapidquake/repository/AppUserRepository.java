package com.rapidquake.repository;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AppUserRepository extends JpaRepository<AppUser, Long> {
    Optional<AppUser> findByEmail(String email);
    Optional<AppUser> findByEmailIgnoreCase(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailIgnoreCase(String email);
    List<AppUser> findByRoleAndFullNameContainingIgnoreCase(Role role, String fullName);
    Optional<AppUser> findByIdAndRole(Long id, Role role);
}
