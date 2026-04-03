package com.sumit.hospitalManagement.security;

import com.sumit.hospitalManagement.dto.LoginRequestDto;
import com.sumit.hospitalManagement.dto.LoginResponseDto;
import com.sumit.hospitalManagement.dto.SignupRequestDto;
import com.sumit.hospitalManagement.dto.SignupResponseDto;
import com.sumit.hospitalManagement.entity.Doctor;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.entity.type.AuthProviderType;
import com.sumit.hospitalManagement.entity.type.RoleType;
import com.sumit.hospitalManagement.repository.DoctorRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import com.sumit.hospitalManagement.repository.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;

    private final AuthUtil authUtil;

    private final UserRepository userRepository;

    private final PasswordEncoder passwordEncoder;

    private final PatientRepository patientRepository;

    private final DoctorRepository doctorRepository;

    /** Builds a LoginResponseDto with username + name resolved from the profile tables. */
    public LoginResponseDto buildLoginResponse(User user) {
        String token = authUtil.generateAccessToken(user);
        return buildLoginResponse(user, token);
    }

    /** Overload that accepts an already-generated token (used by /auth/me). */
    public LoginResponseDto buildLoginResponse(User user, String token) {
        String name  = null;

        // Resolve display name from Patient or Doctor profile
        if (user.getRoles().contains(RoleType.DOCTOR)) {
            Doctor doctor = doctorRepository.findById(user.getId()).orElse(null);
            if (doctor != null) name = doctor.getName();
        }
        if (name == null && user.getRoles().contains(RoleType.PATIENT)) {
            Patient patient = patientRepository.findById(user.getId()).orElse(null);
            if (patient != null) name = patient.getName();
        }
        // Fallback: use the part of the email before '@'
        if (name == null && user.getUsername() != null) {
            name = user.getUsername().contains("@")
                    ? user.getUsername().split("@")[0]
                    : user.getUsername();
        }

        LoginResponseDto dto = new LoginResponseDto();
        dto.setJwt(token);
        dto.setUserId(user.getId());
        dto.setRoles(user.getRoles());
        dto.setUsername(user.getUsername());
        dto.setName(name);
        return dto;
    }

    public LoginResponseDto login(LoginRequestDto loginRequestDto) {

        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequestDto.getUsername(), loginRequestDto.getPassword())
        );

        User user = (User) authentication.getPrincipal();
        assert user != null;
        return buildLoginResponse(user);
    }

    @Transactional
    public User signupInternal(SignupRequestDto signupRequestDto, AuthProviderType providerType, String providerId){
        User user = userRepository.findByUsername(signupRequestDto.getUsername()).orElse(null);

        if(user != null) throw new IllegalArgumentException("User already exist");

        // Sanitize roles for public signup — only EMAIL provider can have DOCTOR role if explicitly set by admin flow
        // For public signups (EMAIL provider, no providerId), only allow PATIENT role
        Set<RoleType> roles = signupRequestDto.getRoles();
        if (roles == null || roles.isEmpty()) {
            roles = Set.of(RoleType.PATIENT);
        }
        // Public signup via EMAIL cannot self-assign ADMIN role
        if (providerType == AuthProviderType.EMAIL && providerId == null) {
            roles = roles.stream()
                    .filter(r -> r != RoleType.ADMIN)
                    .collect(Collectors.toSet());
            if (roles.isEmpty()) roles = Set.of(RoleType.PATIENT);
        }

        user = User.builder()
                .username(signupRequestDto.getUsername())
                .providerId(providerId)
                .providerType(providerType)
                .roles(new HashSet<>(roles))
                .build();

        if(providerType == AuthProviderType.EMAIL){
            user.setPassword(passwordEncoder.encode(signupRequestDto.getPassword()));
        }

        userRepository.save(user);

        // Only create a Patient profile if the user has the PATIENT role
        if (user.getRoles().contains(RoleType.PATIENT)) {
            Patient patient = Patient.builder()
                    .name(signupRequestDto.getName())
                    .email(signupRequestDto.getUsername())
                    .birthDate(signupRequestDto.getBirthDate())
                    .gender(signupRequestDto.getGender())
                    .bloodGroup(signupRequestDto.getBloodGroup())
                    .user(user)
                    .build();
            patientRepository.save(patient);
        }

        return user;

    }

    public SignupResponseDto signup(SignupRequestDto signupResponseDto){
        User user = signupInternal(signupResponseDto,AuthProviderType.EMAIL,null);
        return new SignupResponseDto(user.getId() ,user.getUsername());
    }

    /** Admin-only: create a user account with DOCTOR role (bypasses role restriction). */
    @Transactional
    public SignupResponseDto createDoctorUser(SignupRequestDto dto) {
        User user = userRepository.findByUsername(dto.getUsername()).orElse(null);
        if (user != null) throw new IllegalArgumentException("User already exist");

        user = User.builder()
                .username(dto.getUsername())
                .providerId(null)
                .providerType(AuthProviderType.EMAIL)
                .roles(new HashSet<>(Set.of(RoleType.DOCTOR)))
                .build();
        user.setPassword(passwordEncoder.encode(dto.getPassword()));
        userRepository.save(user);
        return new SignupResponseDto(user.getId(), user.getUsername());
    }

    @Transactional
    public ResponseEntity<LoginResponseDto> handleOAuthorizedLoginRequest(OAuth2User oAuth2User, String registrationId) {
        AuthProviderType providerType = authUtil.getProviderTypeFromRegistrationId(registrationId);

        String providerId = authUtil.determineProviderIdFromOAuth2User(oAuth2User, registrationId);

        User user = userRepository.findByProviderIdAndProviderType(providerId, providerType).orElse(null);

        String email = oAuth2User.getAttribute("email");
        String name = oAuth2User.getAttribute("name");

        User emailUser = userRepository.findByUsername(email).orElse(null);

        if(user == null && emailUser == null){
            //Signup flow
            String username = authUtil.determineUsernameFromOAuth2User(oAuth2User,registrationId,providerId);

            SignupRequestDto oauthSignup = new SignupRequestDto();
            oauthSignup.setUsername(username);
            oauthSignup.setName(name != null ? name : username);
            oauthSignup.setRoles(new HashSet<>(Set.of(RoleType.PATIENT)));

            user = signupInternal(oauthSignup, providerType, providerId);

        } else if (user != null) {
            // Update email if provider now provides one and it differs
            if(email != null && !email.isBlank() && !email.equals(user.getUsername())){
                // Only update if the email is not already taken by another user
                if (userRepository.findByUsername(email).isEmpty()) {
                    user.setUsername(email);
                    userRepository.save(user);
                }
            }
        } else {
            // emailUser != null — email already registered with a different provider
            throw new BadCredentialsException("This email is already registered with provider: " + emailUser.getProviderType());
        }

        LoginResponseDto loginResponseDto = buildLoginResponse(user);
        return ResponseEntity.ok(loginResponseDto);


    }
}
