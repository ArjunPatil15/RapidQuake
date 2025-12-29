package com.rapidquake.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class HomeController {
	
	@GetMapping("/")
	public String index() {
		return "index";
	}
	
	@GetMapping("/login")
	public String login() {
		return "login";
	}
	
	@GetMapping("/adminLogin")
	public String adminLogin() {
		return "adminLogin";
	}
	
	@GetMapping("/register")
	public String showRegisterForm(Model model) {
	    //model.addAttribute("user", new User());  // your DTO/entity
	    return "register";
	}
	
	@GetMapping("/map")
	public String showMap() {
	    return "User/userMap";
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
}
