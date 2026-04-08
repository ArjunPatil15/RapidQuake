package com.rapidquake.config;

import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@ControllerAdvice
public class NavModelAdvice {

    private final AppUserRepository appUserRepository;

    public NavModelAdvice(AppUserRepository appUserRepository) {
        this.appUserRepository = appUserRepository;
    }

    @ModelAttribute
    public void addNavUserProfile(Authentication authentication, Model model) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return;
        }
        ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attrs != null) {
            String uri = attrs.getRequest().getRequestURI();
            if (uri.startsWith("/api/")) {
                return;
            }
        }
        String email = authentication.getName();
        if (email == null || email.isEmpty()) {
            return;
        }
        appUserRepository.findByEmail(email).ifPresent(u -> {
            if (u.getRole() == Role.USER) {
                model.addAttribute("navProfilePhoto", u.getProfilePhotoPath());
                model.addAttribute("navDisplayName", u.getFullName());
            }
        });
    }
}
