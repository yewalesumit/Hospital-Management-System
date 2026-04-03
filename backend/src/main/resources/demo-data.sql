-- =============================================================
--  HOSPITAL MANAGEMENT SYSTEM — DEMO DATA
--
--  HOW TO RUN (in mysql> prompt, use FORWARD slashes):
--    SOURCE D:/Itvedant/final project/hospital-management-system/backend/src/main/resources/demo-data.sql
--
--  OR in MySQL Workbench:
--    File → Open SQL Script → select this file → ⚡ Execute
--
--  Safe to run multiple times (INSERT IGNORE).
--  All user passwords = Test@1234
-- =============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ─────────────────────────────────────────────────────────────
-- 1. USERS
--    BCrypt hash of "Test@1234"
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `user` (id, username, password, provider_id, provider_type) VALUES
(1,  'admin@hospital.com',          '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(2,  'dr.amit.sharma@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(3,  'dr.neha.verma@hospital.com',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(4,  'dr.rahul.mehta@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(5,  'dr.pooja.singh@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(6,  'dr.suresh.iyer@hospital.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(7,  'rahul.sharma@gmail.com',      '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(8,  'anita.verma@gmail.com',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(9,  'vikas.patil@gmail.com',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(10, 'neha.singh@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(11, 'amit.kumar@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(12, 'pooja.mehta@gmail.com',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(13, 'suresh.rao@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(14, 'kavita.nair@gmail.com',       '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(15, 'rohit.jain@gmail.com',        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL'),
(16, 'sneha.kulkarni@gmail.com',    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LPVLeu9agda', NULL, 'EMAIL');

-- ─────────────────────────────────────────────────────────────
-- 2. USER ROLES
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `user_roles` (user_id, role) VALUES
(1,  'ADMIN'),
(2,  'DOCTOR'),
(3,  'DOCTOR'),
(4,  'DOCTOR'),
(5,  'DOCTOR'),
(6,  'DOCTOR'),
(7,  'PATIENT'),
(8,  'PATIENT'),
(9,  'PATIENT'),
(10, 'PATIENT'),
(11, 'PATIENT'),
(12, 'PATIENT'),
(13, 'PATIENT'),
(14, 'PATIENT'),
(15, 'PATIENT'),
(16, 'PATIENT');

-- ─────────────────────────────────────────────────────────────
-- 3. PATIENTS
--    PK column = user_id  (because of @MapsId on User)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `patient` (user_id, name, email, birth_date, gender, blood_group, created_at, patirnt_insurance_id) VALUES
(7,  'Rahul Sharma',   'rahul.sharma@gmail.com',   '1998-06-15', 'MALE',   'O_POSITIVE',  NOW(), NULL),
(8,  'Anita Verma',    'anita.verma@gmail.com',    '2000-02-20', 'FEMALE', 'A_POSITIVE',  NOW(), NULL),
(9,  'Vikas Patil',    'vikas.patil@gmail.com',    '1995-11-08', 'MALE',   'B_NEGATIVE',  NOW(), NULL),
(10, 'Neha Singh',     'neha.singh@gmail.com',     '1999-03-12', 'FEMALE', 'AB_POSITIVE', NOW(), NULL),
(11, 'Amit Kumar',     'amit.kumar@gmail.com',     '1997-09-25', 'MALE',   'O_NEGATIVE',  NOW(), NULL),
(12, 'Pooja Mehta',    'pooja.mehta@gmail.com',    '2001-01-05', 'FEMALE', 'B_POSITIVE',  NOW(), NULL),
(13, 'Suresh Rao',     'suresh.rao@gmail.com',     '1994-07-30', 'MALE',   'A_NEGATIVE',  NOW(), NULL),
(14, 'Kavita Nair',    'kavita.nair@gmail.com',    '1996-12-18', 'FEMALE', 'AB_NEGATIVE', NOW(), NULL),
(15, 'Rohit Jain',     'rohit.jain@gmail.com',     '1998-04-09', 'MALE',   'O_POSITIVE',  NOW(), NULL),
(16, 'Sneha Kulkarni', 'sneha.kulkarni@gmail.com', '2002-08-14', 'FEMALE', 'A_POSITIVE',  NOW(), NULL);

-- ─────────────────────────────────────────────────────────────
-- 4. DOCTORS
--    PK column = user_id  (because of @MapsId on User)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `doctor` (user_id, name, specialization, email) VALUES
(2, 'Amit Sharma', 'Cardiology',  'dr.amit.sharma@hospital.com'),
(3, 'Neha Verma',  'Neurology',   'dr.neha.verma@hospital.com'),
(4, 'Rahul Mehta', 'Orthopedics', 'dr.rahul.mehta@hospital.com'),
(5, 'Pooja Singh', 'Pediatrics',  'dr.pooja.singh@hospital.com'),
(6, 'Suresh Iyer', 'Dermatology', 'dr.suresh.iyer@hospital.com');

-- Strip "Dr. " prefix if already stored (prevents "Dr. Dr. Name" in UI)
UPDATE `doctor` SET name = SUBSTRING(name, 5) WHERE name LIKE 'Dr. %';

-- ─────────────────────────────────────────────────────────────
-- 5. INSURANCE
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `insurance` (id, policy_number, provider, valid_until, created_at) VALUES
(1, 'ICICI_2024_001', 'ICICI Lombard', '2028-12-31', NOW()),
(2, 'HDFC_2024_002',  'HDFC ERGO',     '2027-06-30', NOW()),
(3, 'STAR_2024_003',  'Star Health',   '2029-03-31', NOW()),
(4, 'BAJAJ_2024_004', 'Bajaj Allianz', '2026-09-30', NOW()),
(5, 'NIVA_2024_005',  'Niva Bupa',     '2030-01-01', NOW());

-- Link insurance to patients
UPDATE `patient` SET patirnt_insurance_id = 1 WHERE user_id = 7  AND patirnt_insurance_id IS NULL;
UPDATE `patient` SET patirnt_insurance_id = 2 WHERE user_id = 8  AND patirnt_insurance_id IS NULL;
UPDATE `patient` SET patirnt_insurance_id = 3 WHERE user_id = 10 AND patirnt_insurance_id IS NULL;
UPDATE `patient` SET patirnt_insurance_id = 4 WHERE user_id = 12 AND patirnt_insurance_id IS NULL;
UPDATE `patient` SET patirnt_insurance_id = 5 WHERE user_id = 15 AND patirnt_insurance_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 6. APPOINTMENTS
--    patient FK → patient_id   (confirmed from schema)
--    doctor  FK → doctor_user_id (confirmed from schema)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `appointment` (appointment_time, reason, patient_id, doctor_user_id) VALUES
('2026-02-01 09:00:00', 'Chest pain and shortness of breath',   7,  2),
('2026-02-03 10:30:00', 'High blood pressure follow-up',        8,  2),
('2026-02-05 11:00:00', 'ECG review and medication adjustment', 11, 2),
('2026-02-02 09:30:00', 'Persistent headache and dizziness',    9,  3),
('2026-02-04 14:00:00', 'Epilepsy medication review',           10, 3),
('2026-02-06 15:30:00', 'Memory loss concerns',                 13, 3),
('2026-02-07 08:30:00', 'Knee pain after sports injury',        11, 4),
('2026-02-08 10:00:00', 'Back pain and posture issues',         14, 4),
('2026-02-10 09:00:00', 'Shoulder dislocation follow-up',      15, 4),
('2026-02-09 11:00:00', 'Child routine vaccination',            12, 5),
('2026-02-11 10:30:00', 'Fever and cold in child',              12, 5),
('2026-02-12 13:00:00', 'Skin rash and allergic reaction',      9,  6),
('2026-02-13 14:30:00', 'Acne treatment consultation',          16, 6),
('2026-02-14 11:00:00', 'Eczema flare-up management',           10, 6),
('2026-03-01 09:00:00', 'Monthly cardiac review',               7,  2),
('2026-03-05 10:00:00', 'Neuro follow-up after medication',     9,  3),
('2026-03-10 11:30:00', 'Post-surgery orthopedic check',        14, 4);

-- ─────────────────────────────────────────────────────────────
-- 7. DEPARTMENTS
--    head doctor FK → head_doctor_user_id  (confirmed from schema)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `department` (id, name, head_doctor_user_id) VALUES
(1, 'Cardiology',       2),
(2, 'Neurology',        3),
(3, 'Orthopedics',      4),
(4, 'Pediatrics',       5),
(5, 'Dermatology',      6),
(6, 'General Medicine', NULL),
(7, 'Emergency',        NULL),
(8, 'Radiology',        NULL);

-- ─────────────────────────────────────────────────────────────
-- 8. DEPARTMENT ↔ DOCTOR join table
--    dpt_id     → department id
--    patient_id → doctor's user_id  (column name from @JoinColumn in entity)
-- ─────────────────────────────────────────────────────────────
INSERT IGNORE INTO `my_dpt_doctors` (dpt_id, patient_id) VALUES
(1, 2),
(2, 3),
(3, 4),
(4, 5),
(5, 6);

SET FOREIGN_KEY_CHECKS = 1;

-- ─────────────────────────────────────────────────────────────
-- VERIFY — expected: USERS=16, PATIENTS=10+, DOCTORS=5,
--          APPOINTMENTS=17, INSURANCE=5, DEPARTMENTS=8
-- ─────────────────────────────────────────────────────────────
SELECT 'USERS'         AS tbl, COUNT(*) AS total FROM `user`
UNION ALL SELECT 'PATIENTS',      COUNT(*) FROM `patient`
UNION ALL SELECT 'DOCTORS',       COUNT(*) FROM `doctor`
UNION ALL SELECT 'APPOINTMENTS',  COUNT(*) FROM `appointment`
UNION ALL SELECT 'INSURANCE',     COUNT(*) FROM `insurance`
UNION ALL SELECT 'DEPARTMENTS',   COUNT(*) FROM `department`;

