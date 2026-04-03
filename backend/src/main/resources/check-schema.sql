-- Run this to see actual column names in your database
-- SOURCE D:/Itvedant/final project/hospital-management-system/backend/src/main/resources/check-schema.sql

SELECT '=== patient ==='      AS info; SHOW COLUMNS FROM `patient`;
SELECT '=== doctor ==='       AS info; SHOW COLUMNS FROM `doctor`;
SELECT '=== appointment ==='  AS info; SHOW COLUMNS FROM `appointment`;
SELECT '=== department ==='   AS info; SHOW COLUMNS FROM `department`;
SELECT '=== my_dpt_doctors ===' AS info; SHOW COLUMNS FROM `my_dpt_doctors`;
SELECT '=== user ==='         AS info; SHOW COLUMNS FROM `user`;

