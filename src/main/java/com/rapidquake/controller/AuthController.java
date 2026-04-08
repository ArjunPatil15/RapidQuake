package com.rapidquake.controller;

import com.rapidquake.service.UserAccountService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
public class AuthController {

    private final UserAccountService userAccountService;

    public AuthController(UserAccountService userAccountService) {
        this.userAccountService = userAccountService;
    }

    @GetMapping("/login")
    public String loginPage() {
        return "user/login";
    }

    @GetMapping("/register")
    public String registerPage() {
        return "user/register";
    }

    @PostMapping("/register")
    public String registerSubmit(
            @RequestParam String fullName,
            @RequestParam String email,
            @RequestParam String city,
            @RequestParam(required = false) String phone,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            @RequestParam(required = false) MultipartFile photo,
            @RequestParam(required = false) Double regLatitude,
            @RequestParam(required = false) Double regLongitude,
            @RequestParam(required = false) Double regAccuracy,
            HttpServletRequest request,
            RedirectAttributes redirectAttributes) {
        if (!password.equals(confirmPassword)) {
            redirectAttributes.addFlashAttribute("error", "Passwords do not match.");
            return "redirect:/register";
        }
        if (password.length() < 8) {
            redirectAttributes.addFlashAttribute("error", "Password must be at least 8 characters.");
            return "redirect:/register";
        }
        try {
            userAccountService.register(fullName, email, city, phone, password, photo,
                    regLatitude, regLongitude, regAccuracy, request);
            redirectAttributes.addFlashAttribute("message", "Account created. Please sign in.");
            return "redirect:/login";
        } catch (IllegalArgumentException e) {
            redirectAttributes.addFlashAttribute("error", e.getMessage());
            return "redirect:/register";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Could not complete registration. Try again.");
            return "redirect:/register";
        }
    }
}
