package com.sumit.hospitalManagement.dto;

import lombok.Data;

@Data
public class AiFaqRequest {
    /** General hospital FAQ question — must NOT contain any patient data. */
    private String question;
}

