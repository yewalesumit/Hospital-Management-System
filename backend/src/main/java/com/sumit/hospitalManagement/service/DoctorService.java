package com.sumit.hospitalManagement.service;

import com.sumit.hospitalManagement.dto.DoctorResponseDto;
import com.sumit.hospitalManagement.dto.OnBoardDoctorRequestDto;
import com.sumit.hospitalManagement.entity.Department;
import com.sumit.hospitalManagement.entity.Doctor;
import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.entity.type.RoleType;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import com.sumit.hospitalManagement.repository.DepartmentRepository;
import com.sumit.hospitalManagement.repository.DoctorRepository;
import com.sumit.hospitalManagement.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.modelmapper.ModelMapper;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DoctorService {

    private final DoctorRepository doctorRepository;
    private final ModelMapper modelMapper;
    private final UserRepository userRepository;
    private final AppointmentRepository appointmentRepository;
    private final DepartmentRepository departmentRepository;

    public List<DoctorResponseDto> getAllDoctor(){
        return doctorRepository.findAll()
                .stream()
                .map(doctor -> modelMapper.map(doctor, DoctorResponseDto.class))
                .collect(Collectors.toList());
    }

    @Transactional
    public DoctorResponseDto onBoardNewDoctor(OnBoardDoctorRequestDto onBoardDoctorRequestDto) {

        User user = userRepository.findById(onBoardDoctorRequestDto.getUserId()).orElseThrow();

        if(doctorRepository.existsById(onBoardDoctorRequestDto.getUserId())){
            throw new IllegalArgumentException("Doctor already exists");
        }

        Doctor doctor = Doctor.builder()
                .name(onBoardDoctorRequestDto.getName())
                .specialization(onBoardDoctorRequestDto.getSpecialization())
                .email(onBoardDoctorRequestDto.getEmail())
                .user(user)
                .build();

        user.getRoles().add(RoleType.DOCTOR);

        userRepository.save(user);

        return modelMapper.map(doctorRepository.save(doctor), DoctorResponseDto.class);
    }

    /**
     * Admin: fully remove a doctor from the system.
     *
     * Order of operations (each step removes a FK reference that would otherwise
     * cause a constraint violation):
     *
     *  1. Null-out doctor_id on every appointment that references this doctor.
     *  2. Null-out head_doctor_id on every department where this doctor is head.
     *  3. Remove the doctor from the many-to-many department membership join table.
     *  4. Delete the Doctor entity.
     *  5. Strip DOCTOR role from the User (keep the user account).
     */
    @Transactional
    public void removeDoctor(Long doctorId) {
        Doctor doctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new EntityNotFoundException("Doctor not found with ID: " + doctorId));

        // 1. Null-out doctor FK on all appointments (avoids FK constraint on appointment.doctor_id)
        appointmentRepository.nullifyDoctorOnAppointments(doctorId);

        // 2. Null-out headDoctor FK on departments (avoids FK constraint on department.head_doctor_id)
        departmentRepository.nullifyHeadDoctor(doctorId);

        // 3. Remove from department membership join table (my_dpt_doctors)
        for (Department dept : doctor.getDepartments()) {
            dept.getDoctors().remove(doctor);
            departmentRepository.save(dept);
        }
        doctor.getDepartments().clear();
        doctorRepository.save(doctor);

        // 4. Delete the Doctor record
        doctorRepository.deleteById(doctorId);

        // 5. Strip DOCTOR role from the linked User account
        User user = doctor.getUser();
        if (user != null) {
            user.getRoles().remove(RoleType.DOCTOR);
            userRepository.save(user);
        }
    }
}
