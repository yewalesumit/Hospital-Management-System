package com.sumit.hospitalManagement.ai;

import com.sumit.hospitalManagement.entity.Appointment;
import com.sumit.hospitalManagement.entity.Patient;
import com.sumit.hospitalManagement.repository.AppointmentRepository;
import com.sumit.hospitalManagement.repository.PatientRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Builds a grounded plain-text context block from the database.
 * This is the ONLY information the LLM is allowed to use.
 *
 * Data sources (all verified from repo entities/repositories):
 *   - PatientRepository.findById()       → demographics + insurance
 *   - AppointmentRepository.findByPatientId() → appointment history + visit reasons
 *
 * If the patient is not found, returns the sentinel "NO_PATIENT_DATA: ..."
 * so the LLM prompt rules will respond "Not found in records."
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class PatientContextBuilder {

    private static final DateTimeFormatter FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    private final PatientRepository     patientRepository;
    private final AppointmentRepository appointmentRepository;

    @Value("${ai.context.max-appointments:5}")
    private int maxAppointments;

    /**
     * Build the plain-text context block for {@code patientId}.
     * Returns "NO_PATIENT_DATA: Patient not found." if patient does not exist.
     */
    public String build(Long patientId) {
        Optional<Patient> opt = patientRepository.findById(patientId);
        if (opt.isEmpty()) {
            log.warn("PatientContextBuilder: patient {} not found", patientId);
            return "NO_PATIENT_DATA: Patient not found.";
        }

        Patient p = opt.get();
        StringBuilder sb = new StringBuilder(512);

        // ── Demographics ──────────────────────────────────────────────────────
        sb.append("=== DEMOGRAPHICS ===\n");
        sb.append("Name       : ").append(safe(p.getName())).append("\n");
        sb.append("Email      : ").append(safe(p.getEmail())).append("\n");
        sb.append("Gender     : ").append(safe(p.getGender())).append("\n");
        sb.append("Birth Date : ")
          .append(p.getBirthDate() != null ? p.getBirthDate().toString() : "Not found in records.")
          .append("\n");
        sb.append("Blood Group: ")
          .append(p.getBloodGroup() != null ? p.getBloodGroup().name() : "Not found in records.")
          .append("\n");

        // ── Insurance ─────────────────────────────────────────────────────────
        sb.append("\n=== INSURANCE ===\n");
        if (p.getInsurance() != null) {
            sb.append("Provider      : ").append(safe(p.getInsurance().getProvider())).append("\n");
            sb.append("Policy Number : ").append(safe(p.getInsurance().getPolicyNumber())).append("\n");
            sb.append("Valid Until   : ").append(p.getInsurance().getValidUntil()).append("\n");
        } else {
            sb.append("Not found in records.\n");
        }

        // ── Appointment history ───────────────────────────────────────────────
        List<Appointment> allAppts = appointmentRepository.findByPatientId(patientId);
        sb.append("\n=== APPOINTMENT HISTORY (last ").append(maxAppointments).append(") ===\n");
        if (allAppts.isEmpty()) {
            sb.append("Not found in records.\n");
        } else {
            allAppts.stream()
                    .sorted(Comparator.comparing(Appointment::getAppointmentTime).reversed())
                    .limit(maxAppointments)
                    .forEach(a -> {
                        String docName = (a.getDoctor() != null) ? safe(a.getDoctor().getName()) : "Unknown";
                        String docSpec = (a.getDoctor() != null) ? safe(a.getDoctor().getSpecialization()) : "Unknown";
                        sb.append("- ").append(a.getAppointmentTime().format(FMT))
                          .append(" | Dr. ").append(docName)
                          .append(" (").append(docSpec).append(")")
                          .append(" | Reason: ").append(safe(a.getReason()))
                          .append("\n");
                    });
        }

        // ── Notes / visit reasons ─────────────────────────────────────────────
        sb.append("\n=== NOTES / REASON FOR VISITS ===\n");
        long notesCount = allAppts.stream()
                .filter(a -> a.getReason() != null && !a.getReason().isBlank())
                .count();
        if (notesCount == 0) {
            sb.append("Not found in records.\n");
        } else {
            allAppts.stream()
                    .filter(a -> a.getReason() != null && !a.getReason().isBlank())
                    .sorted(Comparator.comparing(Appointment::getAppointmentTime).reversed())
                    .limit(maxAppointments)
                    .forEach(a -> sb.append("- [")
                            .append(a.getAppointmentTime().format(FMT))
                            .append("] ")
                            .append(a.getReason().trim())
                            .append("\n"));
        }

        log.info("PatientContextBuilder: built context for patient={} length={}", patientId, sb.length());
        return sb.toString();
    }

    private static String safe(String s) {
        return (s == null || s.isBlank()) ? "Not found in records." : s.trim();
    }
}

