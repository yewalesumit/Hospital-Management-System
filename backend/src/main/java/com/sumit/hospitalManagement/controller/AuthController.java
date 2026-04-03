package com.sumit.hospitalManagement.controller;

import com.sumit.hospitalManagement.dto.LoginRequestDto;
import com.sumit.hospitalManagement.dto.LoginResponseDto;
import com.sumit.hospitalManagement.dto.SignupRequestDto;
import com.sumit.hospitalManagement.dto.SignupResponseDto;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.security.AuthService;
import com.sumit.hospitalManagement.security.AuthUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final AuthUtil    authUtil;

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDto> login(@RequestBody LoginRequestDto loginRequestDto){
        return ResponseEntity.ok(authService.login(loginRequestDto));
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponseDto> signup(@RequestBody SignupRequestDto signupRequestDto){
        return ResponseEntity.ok(authService.signup(signupRequestDto));
    }

    /**
     * GET /auth/me
     * Validates the JWT token and returns the current user's info.
     * Returns 401 automatically if the token is missing/expired/invalid
     * (handled by JwtAuthFilter + Spring Security).
     */
    @GetMapping("/me")
    public ResponseEntity<LoginResponseDto> me(@AuthenticationPrincipal User user) {
        // Re-issue a fresh token so the frontend stays logged in as long as active
        String freshToken = authUtil.generateAccessToken(user);
        LoginResponseDto dto = authService.buildLoginResponse(user, freshToken);
        return ResponseEntity.ok(dto);
    }
}
