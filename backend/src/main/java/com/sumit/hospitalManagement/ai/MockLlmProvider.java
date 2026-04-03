package com.sumit.hospitalManagement.ai;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
/**
 * Deterministic mock LLM used in tests and local dev when ollama.enabled=false.
 * Parses the patient context block and returns real data-driven answers.
 */
@Component
@ConditionalOnProperty(name = "ollama.enabled", havingValue = "false")
@Slf4j
public class MockLlmProvider implements LlmProvider {
    private static final String[] INJECTION_KEYWORDS = {
        "ignore previous", "ignore all instructions", "forget your instructions",
        "you are now", "act as", "jailbreak", "disregard", "override system",
        "new instructions", "system prompt"
    };
    @Override
    public String complete(String systemPrompt, String userMessage) {
        log.info("MockLlmProvider invoked mode={} msgLen={}",
                detectMode(systemPrompt), userMessage != null ? userMessage.length() : 0);
        String msg = userMessage != null ? userMessage : "";
        if (containsInjection(msg)) {
            if (systemPrompt.contains("[FAQ_MODE]"))
                return "I can only answer general FAQ questions about MediCare.";
            return "I can only answer questions based on the provided patient context.";
        }
        if (systemPrompt.contains("[FAQ_MODE]")) return handleFaq(msg);
        if (systemPrompt.contains("NO_PATIENT_DATA")) return "Not found in records.";
        return handlePatientQa(systemPrompt, msg);
    }
    private String handlePatientQa(String systemPrompt, String question) {
        String lower       = question.toLowerCase();
        String name        = extractField(systemPrompt, "Name");
        String email       = extractField(systemPrompt, "Email");
        String gender      = extractField(systemPrompt, "Gender");
        String birthDate   = extractField(systemPrompt, "Birth Date");
        String bloodGroup  = extractField(systemPrompt, "Blood Group");
        String insProvider = extractField(systemPrompt, "Provider");
        String insPolicy   = extractField(systemPrompt, "Policy Number");
        String insValid    = extractField(systemPrompt, "Valid Until");
        String appointments = extractSection(systemPrompt, "APPOINTMENT HISTORY");
        String notes        = extractSection(systemPrompt, "NOTES / REASON FOR VISITS");
        String bgFormatted = bloodGroup != null
                ? bloodGroup.replace("_POSITIVE", "+").replace("_NEGATIVE", "-") : "N/A";
        if (lower.contains("summary") || lower.contains("clinical summary") || lower.contains("overview")) {
            return "## Patient Summary\n\n"
                    + "**Demographics**\n"
                    + "- Name: " + name + "\n"
                    + "- Gender: " + gender + "\n"
                    + "- Date of Birth: " + birthDate + "\n"
                    + "- Blood Group: " + bgFormatted + "\n\n"
                    + "**Insurance**\n"
                    + (insProvider != null && !insProvider.contains("Not found")
                        ? "- Provider: " + insProvider + "\n- Policy: " + insPolicy + "\n- Valid Until: " + insValid + "\n\n"
                        : "- No insurance on record.\n\n")
                    + "**Appointment History**\n"
                    + (appointments != null && !appointments.contains("Not found") ? appointments : "No appointments on record.")
                    + "\n\n**Visit Reasons**\n"
                    + (notes != null && !notes.contains("Not found") ? notes : "No notes on record.");
        }
        if (lower.contains("blood")) {
            if (bloodGroup == null || bloodGroup.contains("Not found"))
                return "Your blood group is not recorded. Please update your profile.";
            return "Your blood group is **" + bgFormatted + "**.";
        }
        if (lower.contains("insurance") || lower.contains("policy") || lower.contains("coverage")) {
            if (insProvider == null || insProvider.contains("Not found"))
                return "No insurance details are on record. You can add insurance from your Patient Dashboard.";
            return "Your insurance:\n- **Provider:** " + insProvider
                    + "\n- **Policy Number:** " + insPolicy
                    + "\n- **Valid Until:** " + insValid;
        }
        if (lower.contains("appointment") || lower.contains("visit") || lower.contains("booked")) {
            if (appointments == null || appointments.contains("Not found"))
                return "You have no appointments on record. Book one from the **Book Appointment** page.";
            return "Your recent appointments:\n" + appointments;
        }
        if (lower.contains("my name") || lower.contains("who am i"))
            return "Your registered name is **" + name + "**.";
        if (lower.contains("email"))
            return "Your registered email is **" + email + "**.";
        if (lower.contains("gender"))
            return "Your recorded gender is **" + gender + "**.";
        if (lower.contains("birth") || lower.contains("dob") || lower.contains("age") || lower.contains("born")) {
            if (birthDate == null || birthDate.contains("Not found"))
                return "Your date of birth is not recorded. Please update your profile.";
            return "Your date of birth is **" + birthDate + "**.";
        }
        if (lower.contains("doctor") || lower.contains("specialist")) {
            if (appointments == null || appointments.contains("Not found"))
                return "You have no recorded appointments with any doctor yet.";
            return "Based on your appointments:\n" + appointments;
        }
        if (lower.contains("reason") || lower.contains("diagnosis") || lower.contains("condition")) {
            if (notes == null || notes.contains("Not found"))
                return "No visit reasons or notes are recorded in your profile.";
            return "Your recorded visit reasons:\n" + notes;
        }
        return "Based on your medical record:\n"
                + "- **Name:** " + name + "\n"
                + "- **Blood Group:** " + bgFormatted + "\n"
                + "- **Insurance:** " + (insProvider != null && !insProvider.contains("Not found") ? insProvider : "None on record") + "\n"
                + "- **Appointments:** " + (appointments != null && !appointments.contains("Not found") ? "On record" : "None") + "\n\n"
                + "Please ask about your blood group, insurance, appointments, or personal details.";
    }
    private String extractField(String context, String fieldName) {
        Pattern p = Pattern.compile("(?m)^" + Pattern.quote(fieldName) + "\\s*:\\s*(.+)$");
        Matcher m = p.matcher(context);
        if (m.find()) { String v = m.group(1).trim(); return v.isEmpty() ? null : v; }
        return null;
    }
    private String extractSection(String context, String sectionName) {
        Pattern p = Pattern.compile(
                "=== " + Pattern.quote(sectionName) + "[^=]*===\\n(.*?)(?=\\n===|\\z)", Pattern.DOTALL);
        Matcher m = p.matcher(context);
        if (m.find()) { String v = m.group(1).trim(); return v.isEmpty() ? null : v; }
        return null;
    }
    private String handleFaq(String question) {
        String lower = question.toLowerCase();
        if (lower.contains("book") || lower.contains("appointment"))
            return "To book an appointment: log in to your patient account, go to **Book Appointment** "
                    + "in the sidebar, select a doctor and available time slot, then complete the payment via Razorpay.";
        if (lower.contains("consultation fee") || lower.contains("how much") || lower.contains("cost"))
            return "The standard consultation fee is **500 INR**, paid through Razorpay.";
        if (lower.contains("payment method") || lower.contains("how to pay") || lower.contains("pay"))
            return "We accept **UPI, debit/credit cards** (Visa, Mastercard), **net banking**, and wallets via Razorpay. "
                    + "The consultation fee is 500 INR.";
        if (lower.contains("cancel") || lower.contains("reschedule"))
            return "Appointments can be cancelled or rescheduled by contacting hospital administration. "
                    + "Only admin users can cancel appointments in the system.";
        if (lower.contains("history") || lower.contains("past appointment") || lower.contains("view appointment"))
            return "Log in to your **Patient Dashboard** and scroll to the Appointments section "
                    + "to view your full appointment history.";
        if (lower.contains("register") || lower.contains("signup") || lower.contains("sign up")
                || lower.contains("new patient") || lower.contains("create account"))
            return "Click **Get Started** on the homepage, fill in your name, email, date of birth, "
                    + "gender, and blood group. You can also sign up quickly with Google or GitHub.";
        if (lower.contains("specialization") || lower.contains("specialist") || lower.contains("department"))
            return "We have specialists in:\n"
                    + "- **Cardiology** - Heart and vascular care\n"
                    + "- **Neurology** - Brain and nerve disorders\n"
                    + "- **Orthopedics** - Bone and joint treatment\n"
                    + "- **Pediatrics** - Child healthcare\n"
                    + "- **Dermatology** - Skin conditions\n"
                    + "- **General Medicine** - Primary care";
        if (lower.contains("doctor") || lower.contains("find doctor"))
            return "You can browse available doctors on the homepage or the Book Appointment page. "
                    + "We have specialists in Cardiology, Neurology, Orthopedics, Pediatrics, Dermatology, and General Medicine.";
        if (lower.contains("secure") || lower.contains("security") || lower.contains("safe")
                || lower.contains("data") || lower.contains("privacy"))
            return "Your data is protected:\n"
                    + "- Passwords are **BCrypt-hashed**\n"
                    + "- Connections use **HTTPS**\n"
                    + "- JWT tokens expire after **1 hour**\n"
                    + "- Role-based access control enforces strict data isolation.";
        if (lower.contains("emergency"))
            return "Emergency services are available **24/7** at the hospital. "
                    + "For non-emergency consultations, please book an appointment online.";
        if (lower.contains("contact") || lower.contains("support") || lower.contains("help"))
            return "You can reach our support team via the contact form on the homepage "
                    + "or email us at **support@medicare.hospital**.";
        if (lower.contains("insurance"))
            return "You can add your health insurance details from the **Patient Dashboard - My Insurance**. "
                    + "We record your provider name, policy number, and expiry date for your visits.";
        if (lower.contains("profile") || lower.contains("update") || lower.contains("edit"))
            return "Log in to your **Patient Dashboard** to view and manage your profile and insurance details.";
        if (lower.contains("policy") || lower.contains("refund"))
            return "Appointments can be cancelled by the admin. Please contact administration for assistance.";
        if (lower.contains("fee"))
            return "The standard consultation fee is **500 INR**, paid through Razorpay.";
        if (lower.contains("hello") || lower.contains("hi") || lower.contains("hey"))
            return "Hello! I am the MediCare FAQ assistant. Ask me anything about our services, "
                    + "appointments, payments, or how to get started!";
        return "I can help with questions about booking appointments, consultation fees, "
                + "doctor specializations, registration, payment methods, insurance, and more. "
                + "Could you please rephrase your question?";
    }
    private boolean containsInjection(String text) {
        if (text == null) return false;
        String lower = text.toLowerCase();
        for (String kw : INJECTION_KEYWORDS) { if (lower.contains(kw)) return true; }
        return false;
    }
    private String detectMode(String systemPrompt) {
        if (systemPrompt == null) return "UNKNOWN";
        if (systemPrompt.contains("[FAQ_MODE]"))     return "FAQ";
        if (systemPrompt.contains("[SUMMARY_MODE]")) return "SUMMARY";
        if (systemPrompt.contains("[QA_MODE]"))      return "QA";
        return "UNKNOWN";
    }
    @Override public String getProviderName() { return "mock"; }
    @Override public String getModelName()    { return "mock-v1"; }
}