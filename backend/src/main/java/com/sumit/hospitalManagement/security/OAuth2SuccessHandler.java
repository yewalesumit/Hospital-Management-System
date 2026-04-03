package com.sumit.hospitalManagement.security;

import com.sumit.hospitalManagement.dto.LoginResponseDto;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OAuth2SuccessHandler implements AuthenticationSuccessHandler {

    private final AuthService authService;

    @Value("${frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2AuthenticationToken token = (OAuth2AuthenticationToken) authentication;
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String registrationId = token.getAuthorizedClientRegistrationId();

        ResponseEntity<LoginResponseDto> loginResponse =
                authService.handleOAuthorizedLoginRequest(oAuth2User, registrationId);

        LoginResponseDto body = loginResponse.getBody();
        if (body == null) {
            response.sendRedirect(frontendBaseUrl + "/login?error=oauth_failed");
            return;
        }

        String roles = body.getRoles().stream()
                .map(Enum::name)
                .collect(Collectors.joining(","));

        String redirectUrl = frontendBaseUrl + "/oauth2/callback"
                + "?token=" + URLEncoder.encode(body.getJwt(), StandardCharsets.UTF_8)
                + "&userId=" + body.getUserId()
                + "&roles=" + URLEncoder.encode(roles, StandardCharsets.UTF_8);

        response.sendRedirect(redirectUrl);
    }
}


