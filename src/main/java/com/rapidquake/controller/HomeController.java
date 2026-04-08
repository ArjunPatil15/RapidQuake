package com.rapidquake.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {

    @GetMapping("/")
    public String index() {
        return "index";
    }

    @GetMapping("/adminLogin")
    public String legacyAdminLogin() {
        return "redirect:/admin/login";
    }

    @GetMapping("/map")
    public String showMap() {
        return "User/userMap";
    }

    @GetMapping("/family")
    public String familyPage() {
        return "User/family";
    }

    @GetMapping("/emergency")
    public String emergencyContacts() {
        return "emergencyContacts";
    }

    @GetMapping("/preparedness")
    public String preparedness() {
        return "preparedness";
    }

    @GetMapping("/first-aid")
    public String firstAid() {
        return "firstAid";
    }

    @GetMapping("/about")
    public String about() {
        return "about";
    }

    @GetMapping("/safety")
    public String safetyTips() {
        return "safety";
    }
}
