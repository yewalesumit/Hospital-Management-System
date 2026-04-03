package com.sumit.hospitalManagement;

import com.sumit.hospitalManagement.entity.Appointment;
import com.sumit.hospitalManagement.service.AppointmentService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;

@SpringBootTest
public class AppointmentTests {

    @Autowired
    private AppointmentService appointmentService;

    @Test
    public void testAppointment(){

//        Appointment appointment = Appointment.builder()
//                .appointmentTime(LocalDate.of(2025,01,28))
//                .reason("Cancer")
//                .build();
//
//        var newAppointment = appointmentService.createNewAppointment(appointment,1L,2L);
//        System.out.println(newAppointment);
//
//        var updatedAppointment = appointmentService.reAssignAppointmentToAnotherDoctor(newAppointment.getId(),1L);
//        System.out.println(updatedAppointment);

    }


}
