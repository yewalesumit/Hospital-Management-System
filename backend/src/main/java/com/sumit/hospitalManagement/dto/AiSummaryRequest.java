package com.sumit.hospitalManagement.dto;

import lombok.Data;

@Data
public class AiSummaryRequest {
    /** ID of the patient to summarise. */
    private Long patientId;
}

