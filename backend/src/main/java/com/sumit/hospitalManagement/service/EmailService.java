package com.sumit.hospitalManagement.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.from:noreply@hospital.com}")
    private String fromEmail;

    private static final DateTimeFormatter FORMATTER =
            DateTimeFormatter.ofPattern("dd MMM yyyy 'at' hh:mm a");

    /**
     * Sends an appointment cancellation email to the patient.
     *
     * @param toEmail           patient's email address
     * @param patientName       patient's full name
     * @param doctorName        assigned doctor's name
     * @param appointmentTime   original appointment date/time
     * @param reason            original appointment reason
     * @param cancelledBy       "DOCTOR" or "ADMIN"
     * @param cancellationNote  optional note from the canceller
     */
    @Async
    public void sendCancellationEmail(
            String toEmail,
            String patientName,
            String doctorName,
            LocalDateTime appointmentTime,
            String reason,
            String cancelledBy,
            String cancellationNote) {

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject("⚠️ Appointment Cancelled – MediCare Hospital");

            String formattedTime = appointmentTime != null
                    ? appointmentTime.format(FORMATTER)
                    : "N/A";

            String cancellerLabel = "DOCTOR".equalsIgnoreCase(cancelledBy)
                    ? "Dr. " + doctorName
                    : "Hospital Administration";

            String noteHtml = (cancellationNote != null && !cancellationNote.isBlank())
                    ? "<tr><td style='padding:8px 0;color:#6b7280;font-size:13px;'>Cancellation Note</td>"
                      + "<td style='padding:8px 0;font-size:14px;font-weight:600;color:#374151;'>"
                      + escapeHtml(cancellationNote) + "</td></tr>"
                    : "";

            String html = """
                    <!DOCTYPE html>
                    <html>
                    <head><meta charset="UTF-8"></head>
                    <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f3f4f6;">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:40px 20px;">
                        <tr><td align="center">
                          <table width="600" cellpadding="0" cellspacing="0"
                                 style="background:#ffffff;border-radius:16px;overflow:hidden;
                                        box-shadow:0 4px 24px rgba(0,0,0,0.08);">

                            <!-- Header -->
                            <tr>
                              <td style="background:linear-gradient(135deg,#dc2626,#b91c1c);
                                         padding:32px 40px;text-align:center;">
                                <div style="font-size:36px;margin-bottom:8px;">🏥</div>
                                <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;">
                                  MediCare Hospital
                                </h1>
                                <p style="margin:6px 0 0;color:#fecaca;font-size:13px;">
                                  Appointment Cancellation Notice
                                </p>
                              </td>
                            </tr>

                            <!-- Alert Banner -->
                            <tr>
                              <td style="background:#fee2e2;padding:16px 40px;border-bottom:2px solid #fecaca;">
                                <p style="margin:0;color:#991b1b;font-size:14px;font-weight:600;text-align:center;">
                                  ⚠️ Your appointment has been cancelled by %s
                                </p>
                              </td>
                            </tr>

                            <!-- Body -->
                            <tr>
                              <td style="padding:32px 40px;">
                                <p style="margin:0 0 8px;font-size:16px;color:#111827;">
                                  Dear <strong>%s</strong>,
                                </p>
                                <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                                  We regret to inform you that your upcoming appointment has been
                                  cancelled. Please find the details below and contact us to
                                  reschedule at your earliest convenience.
                                </p>

                                <!-- Appointment Details Card -->
                                <table width="100%%" cellpadding="0" cellspacing="0"
                                       style="background:#f9fafb;border:1px solid #e5e7eb;
                                              border-radius:12px;padding:20px 24px;margin-bottom:24px;">
                                  <tr>
                                    <td style="padding:4px 0 16px;font-size:12px;font-weight:700;
                                               color:#9ca3af;text-transform:uppercase;letter-spacing:0.05em;"
                                        colspan="2">
                                      Appointment Details
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:8px 0;color:#6b7280;font-size:13px;width:40%%;">
                                      Doctor
                                    </td>
                                    <td style="padding:8px 0;font-size:14px;font-weight:600;color:#374151;">
                                      Dr. %s
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:8px 0;color:#6b7280;font-size:13px;">
                                      Scheduled Date &amp; Time
                                    </td>
                                    <td style="padding:8px 0;font-size:14px;font-weight:600;color:#374151;">
                                      %s
                                    </td>
                                  </tr>
                                  <tr>
                                    <td style="padding:8px 0;color:#6b7280;font-size:13px;">
                                      Reason for Visit
                                    </td>
                                    <td style="padding:8px 0;font-size:14px;font-weight:600;color:#374151;">
                                      %s
                                    </td>
                                  </tr>
                                  %s
                                </table>

                                <!-- CTA -->
                                <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6;">
                                  To book a new appointment, please visit our portal or call the
                                  hospital reception. We apologise for any inconvenience caused.
                                </p>

                                <table cellpadding="0" cellspacing="0">
                                  <tr>
                                    <td style="background:#4f46e5;border-radius:8px;">
                                      <a href="http://localhost:5173"
                                         style="display:inline-block;padding:12px 28px;
                                                color:#ffffff;font-size:14px;font-weight:600;
                                                text-decoration:none;">
                                        Book New Appointment →
                                      </a>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                            </tr>

                            <!-- Footer -->
                            <tr>
                              <td style="background:#f9fafb;padding:20px 40px;
                                         border-top:1px solid #e5e7eb;text-align:center;">
                                <p style="margin:0;font-size:12px;color:#9ca3af;">
                                  This is an automated message from MediCare Hospital Management System.
                                  Please do not reply to this email.
                                </p>
                              </td>
                            </tr>

                          </table>
                        </td></tr>
                      </table>
                    </body>
                    </html>
                    """.formatted(
                            escapeHtml(cancellerLabel),
                            escapeHtml(patientName),
                            escapeHtml(doctorName),
                            formattedTime,
                            escapeHtml(reason != null ? reason : "N/A"),
                            noteHtml
                    );

            helper.setText(html, true);
            mailSender.send(message);
            log.info("Cancellation email sent to {} for appointment cancelled by {}", toEmail, cancelledBy);

        } catch (MessagingException e) {
            log.error("Failed to send cancellation email to {}: {}", toEmail, e.getMessage());
        }
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text.replace("&", "&amp;")
                   .replace("<", "&lt;")
                   .replace(">", "&gt;")
                   .replace("\"", "&quot;");
    }
}

