package com.rapidquake.controller;

import com.rapidquake.model.Role;
import com.rapidquake.model.TrappedReport;
import com.rapidquake.repository.AppUserRepository;
import com.rapidquake.service.EmergencyService;
import com.rapidquake.service.TrappedReportService;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

import java.util.List;
import java.util.stream.Collectors;

@Controller
public class AdminPageController {

    private final AppUserRepository appUserRepository;
    private final TrappedReportService trappedReportService;
    private final EmergencyService emergencyService;

    public AdminPageController(AppUserRepository appUserRepository,
                               TrappedReportService trappedReportService,
                               EmergencyService emergencyService) {
        this.appUserRepository = appUserRepository;
        this.trappedReportService = trappedReportService;
        this.emergencyService = emergencyService;
    }

    @GetMapping("/admin")
    public String adminRoot() {
        return "redirect:/admin/dashboard";
    }

    @GetMapping("/admin/login")
    public String adminLogin() {
        return "admin/adminLogin";
    }

    @GetMapping("/admin/dashboard")
    public String dashboard(Model model) {
        long appUsers = appUserRepository.findAll().stream().filter(u -> u.getRole() == Role.USER).count();
        model.addAttribute("pageTitle", "Dashboard | RapidQuake Admin");
        model.addAttribute("activeNav", "dashboard");
        model.addAttribute("userCount", appUsers);
        model.addAttribute("trappedCount", trappedReportService.findAll().size());
        model.addAttribute("emergencyActive", emergencyService.isActive());
        return "admin/dashboard";
    }

    @GetMapping("/admin/users")
    public String users(Model model) {
        model.addAttribute("pageTitle", "Users | RapidQuake Admin");
        model.addAttribute("activeNav", "users");
        model.addAttribute("users", appUserRepository.findAll().stream()
                .filter(u -> u.getRole() == Role.USER)
                .collect(Collectors.toList()));
        return "admin/users";
    }

    @GetMapping("/admin/trapped")
    public String trapped(Model model) {
        model.addAttribute("pageTitle", "Trapped users | RapidQuake Admin");
        model.addAttribute("activeNav", "trapped");
        List<TrappedReport> reports = trappedReportService.findAll();
        model.addAttribute("reports", reports);
        return "admin/trapped";
    }

}
