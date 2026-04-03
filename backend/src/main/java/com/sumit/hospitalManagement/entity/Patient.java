package com.sumit.hospitalManagement.entity;

import com.sumit.hospitalManagement.entity.type.BloodGroupType;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@ToString
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Table(
        name = "patient",
        indexes = @Index(name = "index_of_birth_date", columnList = "birthDate")
)
public class Patient {

    @Id
    private Long id;

    @Column(nullable = false,length = 40)
    private String name;

//    @ToString.Exclude
    private LocalDate birthDate;

    @Column(nullable = false,unique = true)
    private String email;

    private String  gender;

    @OneToOne
    @MapsId
    private User user;

    @Enumerated(EnumType.STRING)
    private BloodGroupType bloodGroup;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @OneToOne(cascade = {CascadeType.ALL},orphanRemoval = true)
    @JoinColumn(name = "patirnt_insurance_id")
    private Insurance insurance;

    @OneToMany(mappedBy = "patient",cascade = {CascadeType.REMOVE},orphanRemoval = true,fetch = FetchType.EAGER)
    @Builder.Default
    private List<Appointment> appointments = new ArrayList<>();
}
