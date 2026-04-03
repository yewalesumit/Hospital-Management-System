package com.sumit.hospitalManagement;

import com.sumit.hospitalManagement.dto.BloodGroupCountResponseEntity;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import com.sumit.hospitalManagement.repository.PatientRepository;
import com.sumit.hospitalManagement.service.PatientService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;

import java.time.LocalDate;
import java.util.List;

@SpringBootTest
public class PatientTests {

    @Autowired
    private PatientRepository patientRepository;
    @Autowired
    private PatientService patientService;

    @Test
    public void testPatientRepository(){
        List<Patient> patientsList = patientRepository.findAllPatientWithAppointment();
        System.out.println(patientsList);

//        Patient p1 = new Patient();
//        patientRepository.save(p1);
    }
    @Test
    public void testTransactionMethods(){

//        Patient patient = patientService.getPatientById(1L);
//        System.out.println(patient);

//        Patient  patient = patientRepository.findByName("Rahul Sharma");

//        Patient patient = patientRepository.findByEmail("neha.singh1@gmail.com");

//        List<Patient> patientList = patientRepository.findByBirthDateOrEmail(LocalDate.of(2000,02,20),"neha.singh1@gmail.com");

//        List<Patient> patientsList = patientRepository.findByBloodGroup(BloodGroupType.A_POSITIVE);

//        List<Patient> patientsList = patientRepository.findByBornAfterDate(LocalDate.of(1999,02,15));

        Page<Patient> patientsList = patientRepository.findAllPatient(PageRequest.of(0,2, Sort.by("name")));
        for(Patient patient:patientsList){
            System.out.println(patient);
        }

//        List<Object[]> bloodGroupList = patientRepository.countEachBloodGroupType();
//        for(Object[] object : bloodGroupList){
//            System.out.println(object[0]+"  "+object[1]);
//        }
//
//        int rowsUpdated = patientRepository.updateNameWithId("Sumit yewale",1L);
//        System.out.println(rowsUpdated);

//        List<BloodGroupCountResponseEntity> bloodGroupList = patientRepository.countEachBloodGroupType();
//        for(BloodGroupCountResponseEntity bloodGroupCountResponse : bloodGroupList){
//            System.out.println(bloodGroupCountResponse);
//        }
    }
}
