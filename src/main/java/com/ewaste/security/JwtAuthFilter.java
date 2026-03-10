package com.ewaste.security;

import java.io.IOException;

import com.ewaste.entity.User;
import com.ewaste.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.ArrayList;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(JwtAuthFilter.class);

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthFilter(JwtService jwtService, UserRepository userRepository) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");
        final boolean isAdminPath = request.getRequestURI() != null
                && request.getRequestURI().startsWith("/admin/");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            if (isAdminPath) {
                log.debug("Admin request without bearer token: {} {}", request.getMethod(), request.getRequestURI());
            }
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);
        final String username;
        final String tokenRole;

        try {
            username = jwtService.extractUsername(token);
            tokenRole = jwtService.extractClaim(token, claims -> claims.get("role", String.class));
        } catch (ExpiredJwtException exception) {
            SecurityContextHolder.clearContext();
            writeUnauthorizedResponse(response, "Session expired. Please log in again.");
            return;
        } catch (JwtException | IllegalArgumentException exception) {
            SecurityContextHolder.clearContext();
            writeUnauthorizedResponse(response, "Invalid authentication token.");
            return;
        }

        final String effectiveRole = resolveRole(username, tokenRole);

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {

            UsernamePasswordAuthenticationToken authToken =
                    new UsernamePasswordAuthenticationToken(
                            username,
                            null,
                            buildAuthorities(effectiveRole)
                    );

            authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
            SecurityContextHolder.getContext().setAuthentication(authToken);

            if (isAdminPath) {
                log.debug("Admin auth resolved: user={}, tokenRole={}, effectiveRole={}, authorities={}",
                        username, tokenRole, effectiveRole, authToken.getAuthorities());
            }
        } else if (isAdminPath) {
            log.debug("Admin auth skipped: user={}, existingAuth={}", username,
                    SecurityContextHolder.getContext().getAuthentication() != null);
        }

        filterChain.doFilter(request, response);
    }

    private void writeUnauthorizedResponse(HttpServletResponse response, String message) throws IOException {
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
        response.setContentType("application/json");
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"message\":\"" + message.replace("\"", "\\\"") + "\"}");
    }

    private String resolveRole(String username, String tokenRole) {
        if (username == null || username.isBlank()) {
            return tokenRole;
        }
        User user = userRepository.findByEmail(username);
        if (user != null && user.getRole() != null) {
            return user.getRole().name();
        }
        return tokenRole;
    }

    private List<SimpleGrantedAuthority> buildAuthorities(String roleClaim) {
        if (roleClaim == null || roleClaim.isBlank()) {
            return List.of();
        }

        String trimmed = roleClaim.trim();
        String withoutPrefix = trimmed.startsWith("ROLE_")
                ? trimmed.substring("ROLE_".length())
                : trimmed;
        String withPrefix = "ROLE_" + withoutPrefix;

        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority(withoutPrefix));
        authorities.add(new SimpleGrantedAuthority(withPrefix));
        return authorities;
    }
}
