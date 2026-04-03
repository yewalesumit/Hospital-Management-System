package com.sumit.hospitalManagement.dto;

import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;
import lombok.ToString;

@AllArgsConstructor
@NoArgsConstructor
@ToString
public class BloodGroupCountResponseEntity {

    private BloodGroupType bloodGroup;

    private Long count;
}
