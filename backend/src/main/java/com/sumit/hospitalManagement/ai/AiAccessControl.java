package com.sumit.hospitalManagement.ai;

import com.sumit.hospitalManagement.entity.User;
import com.sumit.hospitalManagement.entity.type.RoleType;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

/**
 * Enforces data-access rules before any patient context is fetched or LLM is called.
 *
 * Rules (verified against repo entity/User.java, entity/Patient.java, entity/Doctor.java,
 *        repository/AppointmentRepository.java):
 *
 *  • FAQ  (patientId == null) → always ALLOW — no patient data accessed
 *  • ADMIN                   → always ALLOW
 *  • DOCTOR                  → ALLOW only if existsByDoctorIdAndPatientId(doctorId, patientId)
 *                              (Doctor.id == User.id via @MapsId — entity/Doctor.java L20-22)
 *  • PATIENT                 → ALLOW only if caller.getId().equals(patientId)
 *                              (Patient.id == User.id via @MapsId — entity/Patient.java L39-41)
 *  • anything else           → DENY
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class AiAccessControl {

    private final AppointmentRepository appointmentRepository;

    /** Immutable result of an access-control check. */
    public record Decision(boolean allowed, String reason) {}

    /**
     * Check whether {@code caller} may access patient context for {@code patientId}.
     * Pass {@code patientId = null} for FAQ (no patient data needed).
     */
    public Decision check(User caller, Long patientId) {

        // ── FAQ ── no patient data at all ─────────────────────────────────────
        if (patientId == null) {
            return new Decision(true, "ALLOWED: public FAQ — no patient data accessed");
        }

        // ── ADMIN ─────────────────────────────────────────────────────────────
        if (caller.getRoles().contains(RoleType.ADMIN)) {
            return new Decision(true, "ALLOWED: caller is ADMIN");
        }

        // ── DOCTOR ────────────────────────────────────────────────────────────
        if (caller.getRoles().contains(RoleType.DOCTOR)) {
            Long doctorId = caller.getId(); // Doctor.id == User.id via @MapsId
            boolean hasAppt = appointmentRepository
                    .existsByDoctorIdAndPatientId(doctorId, patientId);
            if (hasAppt) {
                return new Decision(true,
                        "ALLOWED: doctor " + caller.getUsername() +
                        " has appointment with patient " + patientId);
            }
            String reason = "DENIED: doctor " + caller.getUsername() +
                            " has no appointment with patient " + patientId;
            log.warn(reason);
            return new Decision(false, reason);
        }

        // ── PATIENT ───────────────────────────────────────────────────────────
        if (caller.getRoles().contains(RoleType.PATIENT)) {
            Long ownId = caller.getId(); // Patient.id == User.id via @MapsId
            if (ownId.equals(patientId)) {
                return new Decision(true,
                        "ALLOWED: patient accessing own record id=" + patientId);
            }
            String reason = "DENIED: patient " + caller.getUsername() +
                            " attempted to access patient " + patientId;
            log.warn(reason);
            return new Decision(false, reason);
        }

        String reason = "DENIED: unrecognised role for caller " + caller.getUsername();
        log.warn(reason);
        return new Decision(false, reason);
    }
}

