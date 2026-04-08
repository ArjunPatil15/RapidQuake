package com.rapidquake.controller;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.service.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

import java.io.IOException;

@Controller
public class UserProfileController {

    private final AppUserRepository appUserRepository;
    private final UserAccountService userAccountService;

    public UserProfileController(AppUserRepository appUserRepository, UserAccountService userAccountService) {
        this.appUserRepository = appUserRepository;
        this.userAccountService = userAccountService;
    }

    @GetMapping("/profile")
    public String profile(@AuthenticationPrincipal UserDetails principal, Model model) {
        model.addAttribute("user", requireAppUser(principal));
        return "User/profile";
    }

    @GetMapping("/profile/edit")
    public String editForm(@AuthenticationPrincipal UserDetails principal, Model model) {
        model.addAttribute("user", requireAppUser(principal));
        return "User/profile-edit";
    }

    @PostMapping("/profile/edit")
    public String editSubmit(
            @AuthenticationPrincipal UserDetails principal,
            @RequestParam String fullName,
            @RequestParam String city,
            @RequestParam(required = false) String phone,
            @RequestParam(required = false) String newPassword,
            @RequestParam(required = false) String confirmPassword,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) String removePhoto,
            RedirectAttributes redirectAttributes) {
        AppUser user = requireAppUser(principal);
        boolean changePassword = newPassword != null && !newPassword.isBlank();
        if (changePassword) {
            if (!newPassword.equals(confirmPassword)) {
                redirectAttributes.addFlashAttribute("error", "New passwords do not match.");
                return "redirect:/profile/edit";
            }
        }
        try {
            userAccountService.updateProfile(user.getId(), fullName, city, phone, newPassword, changePassword, photo,
                    "on".equalsIgnoreCase(removePhoto));
            redirectAttributes.addFlashAttribute("message", "Your profile was updated.");
            return "redirect:/profile";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/profile/edit";
        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("error", "Could not save photo. Try again.");
            return "redirect:/profile/edit";
        }
    }

    @PostMapping("/profile/delete")
    public String deleteAccount(
            @AuthenticationPrincipal UserDetails principal,
            HttpServletRequest request,
            HttpServletResponse response) {
        AppUser user = requireAppUser(principal);
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        try {
            userAccountService.deleteAccount(user.getId());
        } catch (IOException ignored) {
        }
        if (auth != null) {
            new SecurityContextLogoutHandler().logout(request, response, auth);
        }
        return "redirect:/?accountDeleted=1";
    }

    private AppUser requireAppUser(UserDetails principal) {
        if (principal == null) {
            throw new IllegalStateException("Not signed in");
        }
        return appUserRepository.findByEmail(principal.getUsername())
                .filter(u -> u.getRole() == Role.USER)
                .orElseThrow(() -> new IllegalStateException("App user not found"));
    }
}
