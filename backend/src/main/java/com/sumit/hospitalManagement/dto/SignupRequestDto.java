package com.sumit.hospitalManagement.dto;

import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import com.sumit.hospitalManagement.entity.type.RoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class SignupRequestDto {

    private String username;
    private String password;
    private String name;

    private Set<RoleType> roles = new HashSet<>();

    // Optional patient profile fields
    private LocalDate birthDate;
    private String gender;
    private BloodGroupType bloodGroup;
}
