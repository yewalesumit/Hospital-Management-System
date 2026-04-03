package com.sumit.hospitalManagement;

import com.sumit.hospitalManagement.service.EmailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import jakarta.mail.internet.MimeMessage;

import java.time.LocalDateTime;

@SpringBootTest
public class EmailTest {

    @Autowired
    private JavaMailSender mailSender;

    @Autowired
    private EmailService emailService;

    @Value("${spring.mail.username}")
    private String testEmail;

    /**
     * Test 1: Raw JavaMailSender — verifies SMTP config is correct
     */
    @Test
    public void testRawSmtpConnection() throws Exception {
        MimeMessage message = mailSender.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, false, "UTF-8");
        helper.setFrom(testEmail);
        helper.setTo(testEmail);
        helper.setSubject("✅ Hospital System — SMTP Test");
        helper.setText("SMTP connection is working correctly! Your email config is valid.", false);

        mailSender.send(message);
        System.out.println("✅ Raw SMTP test passed — email sent to: " + testEmail);
    }

    /**
     * Test 2: Full EmailService — verifies the HTML cancellation email template
     */
    @Test
    public void testCancellationEmailTemplate() throws Exception {
        emailService.sendCancellationEmail(
                testEmail,                          // patient email (sending to yourself to test)
                "Sumit Yewale",                     // patient name
                "John Smith",                       // doctor name
                LocalDateTime.now().plusDays(2),    // appointment time
                "Routine Checkup",                  // reason
                "DOCTOR",                           // cancelled by
                "Doctor is unavailable due to emergency. Please reschedule."  // cancellation note
        );
        // Give async thread time to send
        Thread.sleep(3000);
        System.out.println("✅ HTML cancellation email template test passed — check inbox: " + testEmail);
    }
}

