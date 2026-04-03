package com.sumit.hospitalManagement.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class Doctor {

    @Id
    private Long id;

    @OneToOne
    @MapsId
    private User user;

    @Column(nullable = false,length = 100)
    private String name;

    @Column(nullable = false,length = 100)
    private String specialization;

    @Column(unique = true, length = 50)
    private String email;

    @ManyToMany(mappedBy = "doctors")
    @Builder.Default
    private Set<Department> departments = new HashSet<>();

    @OneToMany(mappedBy = "doctor")
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();
}
