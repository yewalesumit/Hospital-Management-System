package com.sumit.hospitalManagement;

import com.sumit.hospitalManagement.entity.Insurance;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.service.InsuranceService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

@SpringBootTest
public class InsuranceTests {

    @Autowired
    private InsuranceService insuranceService;

    @Test
    public void testInsurance(){
        Insurance insurance = Insurance.builder()
                .policyNumber("ICICI_1234")
                .provider("ICICI")
                .validUntil(LocalDate.of(2030,12,12))
                .build();

        Patient patient = insuranceService.assignInsuranceToPatient(insurance,1L);
        System.out.println(patient);
//
//        var newPatient = insuranceService.disaccociateInsuranceFromPatient(patient.getId());
//        System.out.println(newPatient);
    }
}
