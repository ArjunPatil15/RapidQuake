package com.rapidquake.security;

import com.rapidquake.model.AppUser;
import com.rapidquake.model.Role;
import com.rapidquake.repository.AppUserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.redirectedUrl;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AppUserLoginIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private AppUserRepository appUserRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void seedAppUser() {
        String email = "appuser@test.local";
        if (appUserRepository.existsByEmail(email)) {
            return;
        }
        AppUser u = new AppUser();
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode("AppUser123!"));
        u.setFullName("Test App User");
        u.setCity("Test City");
        u.setRole(Role.USER);
        appUserRepository.save(u);
    }

    @Test
    void appLoginSuccessRedirectsToProfile() throws Exception {
        mockMvc.perform(post("/login")
                        .with(csrf())
                        .param("email", "appuser@test.local")
                        .param("password", "AppUser123!"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/profile"));
    }

    @Test
    void appLoginBadPassword() throws Exception {
        mockMvc.perform(post("/login")
                        .with(csrf())
                        .param("email", "appuser@test.local")
                        .param("password", "wrong"))
                .andExpect(status().is3xxRedirection())
                .andExpect(redirectedUrl("/login?error"));
    }
}
