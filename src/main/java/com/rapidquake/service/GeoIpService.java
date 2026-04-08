package com.rapidquake.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.Optional;

@Service
public class GeoIpService {

    private static final Logger log = LoggerFactory.getLogger(GeoIpService.class);

    private final RestTemplate restTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public GeoIpService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public String resolveClientIp(HttpServletRequest request) {
        if (request == null) {
            return "";
        }
        String xf = request.getHeader("X-Forwarded-For");
        if (xf != null && !xf.isBlank()) {
            return xf.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "";
    }

    /**
     * Best-effort approximate location from public IP (no browser permission required).
     */
    public Optional<GeoResult> lookup(String ip) {
        if (ip == null || ip.isBlank() || "127.0.0.1".equals(ip) || "0:0:0:0:0:0:0:1".equals(ip)) {
            return Optional.empty();
        }
        String clean = ip.split(",")[0].trim();
        try {
            String url = "http://ip-api.com/json/" + clean + "?fields=status,lat,lon,city,regionName,country,query";
            String body = restTemplate.getForObject(url, String.class);
            if (body == null) {
                return Optional.empty();
            }
            JsonNode root = objectMapper.readTree(body);
            if (!root.path("status").asText().equals("success")) {
                return Optional.empty();
            }
            double lat = root.path("lat").asDouble();
            double lon = root.path("lon").asDouble();
            if (lat == 0 && lon == 0) {
                return Optional.empty();
            }
            String city = root.path("city").asText("");
            String region = root.path("regionName").asText("");
            String country = root.path("country").asText("");
            String label = String.join(", ", city, region, country).replaceAll("^, |, $", "").trim();
            return Optional.of(new GeoResult(lat, lon, label.isEmpty() ? "IP-based (approximate)" : label + " (approximate)"));
        } catch (Exception e) {
            log.debug("Geo IP lookup failed: {}", e.getMessage());
            return Optional.empty();
        }
    }

    public record GeoResult(double latitude, double longitude, String note) {}
}
