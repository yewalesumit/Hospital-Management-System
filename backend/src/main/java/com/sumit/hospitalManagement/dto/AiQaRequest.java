package com.sumit.hospitalManagement.dto;

import lombok.Data;

@Data
public class AiQaRequest {
    /** ID of the patient to query. */
    private Long patientId;
    /** The user's question — grounded in patient context only. */
    private String question;
}

