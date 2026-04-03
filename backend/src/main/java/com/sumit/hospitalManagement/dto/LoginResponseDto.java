package com.sumit.hospitalManagement.dto;


import com.sumit.hospitalManagement.entity.type.RoleType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LoginResponseDto {

    String jwt;
    Long userId;
    Set<RoleType> roles;
    String username;   // e.g. "john@example.com"
    String name;       // e.g. "John Doe" — from Patient or Doctor profile
}
