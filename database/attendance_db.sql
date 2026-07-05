-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Jun 07, 2026 at 07:30 PM
-- Server version: 10.4.32-MariaDB
-- PHP Version: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `attendance_db`
--

DELIMITER $$
--
-- Procedures
--
CREATE DEFINER=`root`@`localhost` PROCEDURE `get_monthly_summary` (IN `emp_id` INT, IN `month_num` INT, IN `year_num` INT)   BEGIN
      SELECT
          u.name AS employee_name,
          COUNT(DISTINCT DATE(a.timestamp)) AS days_present,
          SUM(CASE WHEN a.flag = 'late' THEN 1 ELSE 0 END) AS late_count,
          ROUND(SUM(CASE WHEN a.type = 'check_out' THEN a.working_hours ELSE 0 END), 2) AS
  total_hours
      FROM attendance_logs a
      JOIN users u ON u.id = a.employee_id
      WHERE a.employee_id = emp_id
        AND MONTH(a.timestamp) = month_num
        AND YEAR(a.timestamp) = year_num;
  END$$

DELIMITER ;

-- --------------------------------------------------------

--
-- Table structure for table `attendance_logs`
--

CREATE TABLE `attendance_logs` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `type` enum('check_in','check_out') NOT NULL,
  `gps_lat` decimal(10,8) DEFAULT NULL,
  `gps_lng` decimal(11,8) DEFAULT NULL,
  `readable_address` varchar(255) DEFAULT NULL,
  `timestamp` datetime NOT NULL,
  `is_valid` tinyint(1) DEFAULT 1,
  `flag` enum('on_time','late','early_departure') DEFAULT NULL,
  `working_hours` decimal(4,2) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `attendance_logs`
--

INSERT INTO `attendance_logs` (`id`, `employee_id`, `branch_id`, `type`, `gps_lat`, `gps_lng`, `readable_address`, `timestamp`, `is_valid`, `flag`, `working_hours`) VALUES
(1, 3, 1, 'check_in', 31.52050000, 74.35880000, '15 Main Blvd, Lahore', '2026-06-02 09:02:00', 1, 'on_time', NULL),
(2, 3, 1, 'check_out', 31.52050000, 74.35880000, '15 Main Blvd, Lahore', '2026-06-02 17:05:00', 1, NULL, 8.05),
(3, 3, 1, 'check_in', 31.52050000, 74.35880000, '15 Main Blvd, Lahore', '2026-06-03 09:20:00', 1, 'late', NULL),
(4, 3, 1, 'check_out', 31.52050000, 74.35880000, '15 Main Blvd, Lahore', '2026-06-03 17:00:00', 1, NULL, 7.67),
(5, 4, 2, 'check_in', 24.86090000, 67.01050000, '22 Sea View, Karachi', '2026-06-02 09:05:00', 1, 'on_time', NULL),
(6, 4, 2, 'check_out', 24.86090000, 67.01050000, '22 Sea View, Karachi', '2026-06-02 18:00:00', 1, NULL, 8.92),
(7, 5, 1, 'check_in', 31.52100000, 74.35900000, '15 Main Blvd, Lahore', '2026-06-03 09:45:00', 1, 'late', NULL),
(8, 6, 3, 'check_in', 33.72900000, 73.09200000, '7 Blue Area, Islamabad', '2026-06-02 08:28:00', 1, 'on_time', NULL),
(9, 6, 3, 'check_out', 33.72900000, 73.09200000, '7 Blue Area, Islamabad', '2026-06-02 16:30:00', 1, NULL, 8.03);

-- --------------------------------------------------------

--
-- Stand-in structure for view `attendance_summary_view`
-- (See below for the actual view)
--
CREATE TABLE `attendance_summary_view` (
`employee_id` int(11)
,`employee_name` varchar(100)
,`branch_name` varchar(100)
,`date` date
,`check_in` datetime
,`check_out` datetime
,`working_hours` decimal(4,2)
,`flag` enum('on_time','late','early_departure')
);

-- --------------------------------------------------------

--
-- Table structure for table `branches`
--

CREATE TABLE `branches` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `address` varchar(255) DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `lat` decimal(10,8) NOT NULL,
  `lng` decimal(11,8) NOT NULL,
  `radius_meters` int(11) DEFAULT 100,
  `shift_start` time DEFAULT NULL,
  `shift_end` time DEFAULT NULL,
  `working_days` varchar(255) DEFAULT NULL,
  `manager_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `branches`
--

INSERT INTO `branches` (`id`, `name`, `address`, `lat`, `lng`, `radius_meters`, `shift_start`, `shift_end`) VALUES
(1, 'Lahore Office', '15 Main Blvd, Lahore', 31.52040000, 74.35870000, 100, '09:00:00', '17:00:00'),
(2, 'Karachi Office', '22 Sea View, Karachi', 24.86080000, 67.01040000, 150, '09:00:00', '18:00:00'),
(3, 'Islamabad Office', '7 Blue Area, Islamabad', 33.72880000, 73.09310000, 120, '08:30:00', '16:30:00');

-- --------------------------------------------------------

--
-- Table structure for table `schedules`
--

CREATE TABLE `schedules` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `branch_id` int(11) NOT NULL,
  `day_of_week` enum('Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday') DEFAULT NULL,
  `shift_start` time DEFAULT NULL,
  `shift_end` time DEFAULT NULL,
  `week_start_date` date DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `schedules`
--

INSERT INTO `schedules` (`id`, `employee_id`, `branch_id`, `day_of_week`, `shift_start`, `shift_end`, `week_start_date`) VALUES
(1, 3, 1, 'Monday', '09:00:00', '17:00:00', '2026-06-02'),
(2, 3, 1, 'Tuesday', '09:00:00', '17:00:00', '2026-06-02'),
(3, 3, 1, 'Wednesday', '09:00:00', '17:00:00', '2026-06-02'),
(4, 4, 2, 'Monday', '09:00:00', '18:00:00', '2026-06-02'),
(5, 4, 2, 'Wednesday', '09:00:00', '18:00:00', '2026-06-02'),
(6, 5, 1, 'Tuesday', '09:00:00', '17:00:00', '2026-06-02'),
(7, 6, 3, 'Monday', '08:30:00', '16:30:00', '2026-06-02');

-- --------------------------------------------------------

--
-- Table structure for table `settings`
--

CREATE TABLE `settings` (
  `id` int(11) NOT NULL,
  `key` varchar(100) NOT NULL,
  `value` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `settings`
--

INSERT INTO `settings` (`id`, `key`, `value`) VALUES
(1, 'company_name', 'Smart Attendance Co.'),
(2, 'geofence_buffer', '50'),
(3, 'email_notifications', 'true'),
(4, 'company_logo', 'logo.png');

-- --------------------------------------------------------

--
-- Table structure for table `shift_requests`
--

CREATE TABLE `shift_requests` (
  `id` int(11) NOT NULL,
  `employee_id` int(11) NOT NULL,
  `schedule_id` int(11) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` enum('pending','approved','denied') DEFAULT 'pending',
  `reviewed_by` int(11) DEFAULT NULL,
  `reviewed_at` datetime DEFAULT NULL,
  `response_note` text DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `shift_requests`
--

INSERT INTO `shift_requests` (`id`, `employee_id`, `schedule_id`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `response_note`) VALUES
(1, 3, 1, 'Doctor appointment in the morning', 'approved', 2, '2026-06-01 10:00:00', 'Approved.\n  Please make up the hours.'),
(2, 5, 6, 'Family emergency', 'pending', NULL, NULL, NULL),
(3, 4, 4, 'Travel delay', 'denied', 2, '2026-06-01 11:00:00', 'Cannot accommodate this week.');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `email` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `position` varchar(100) DEFAULT NULL,
  `avatar` longtext DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('admin','hr','employee') NOT NULL,
  `branch_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `role`, `branch_id`, `is_active`) VALUES
(1, 'Admin User', 'admin@company.com', 'hashed_password', 'admin', 1, 1),
(2, 'Sara HR', 'sara.hr@company.com', 'hashed_password', 'hr', 1, 1),
(3, 'Ali Ahmed', 'ali@company.com', 'hashed_password', 'employee', 1, 1),
(4, 'Fatima Khan', 'fatima@company.com', 'hashed_password', 'employee', 2, 1),
(5, 'Usman Tariq', 'usman@company.com', 'hashed_password', 'employee', 1, 1),
(6, 'Ayesha Malik', 'ayesha@company.com', 'hashed_password', 'employee', 3, 1);

-- --------------------------------------------------------

--
-- Structure for view `attendance_summary_view`
--
DROP TABLE IF EXISTS `attendance_summary_view`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `attendance_summary_view`  AS SELECT `u`.`id` AS `employee_id`, `u`.`name` AS `employee_name`, `b`.`name` AS `branch_name`, cast(`a`.`timestamp` as date) AS `date`, max(case when `a`.`type` = 'check_in' then `a`.`timestamp` end) AS `check_in`, max(case when `a`.`type` = 'check_out' then `a`.`timestamp` end) AS `check_out`, max(`a`.`working_hours`) AS `working_hours`, max(`a`.`flag`) AS `flag` FROM ((`attendance_logs` `a` join `users` `u` on(`u`.`id` = `a`.`employee_id`)) join `branches` `b` on(`b`.`id` = `a`.`branch_id`)) GROUP BY `u`.`id`, `u`.`name`, `b`.`name`, cast(`a`.`timestamp` as date) ;

--
-- Indexes for dumped tables
--

--
-- Indexes for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `branch_id` (`branch_id`),
  ADD KEY `idx_attendance_employee_timestamp` (`employee_id`,`timestamp`);

--
-- Indexes for table `branches`
--
ALTER TABLE `branches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `schedules`
--
ALTER TABLE `schedules`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `branch_id` (`branch_id`);

--
-- Indexes for table `settings`
--
ALTER TABLE `settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `key` (`key`);

--
-- Indexes for table `shift_requests`
--
ALTER TABLE `shift_requests`
  ADD PRIMARY KEY (`id`),
  ADD KEY `employee_id` (`employee_id`),
  ADD KEY `schedule_id` (`schedule_id`),
  ADD KEY `reviewed_by` (`reviewed_by`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`),
  ADD KEY `branch_id` (`branch_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `branches`
--
ALTER TABLE `branches`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `schedules`
--
ALTER TABLE `schedules`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- AUTO_INCREMENT for table `settings`
--
ALTER TABLE `settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=5;

--
-- AUTO_INCREMENT for table `shift_requests`
--
ALTER TABLE `shift_requests`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `attendance_logs`
--
ALTER TABLE `attendance_logs`
  ADD CONSTRAINT `attendance_logs_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `attendance_logs_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `schedules`
--
ALTER TABLE `schedules`
  ADD CONSTRAINT `schedules_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `schedules_ibfk_2` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `shift_requests`
--
ALTER TABLE `shift_requests`
  ADD CONSTRAINT `shift_requests_ibfk_1` FOREIGN KEY (`employee_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_requests_ibfk_2` FOREIGN KEY (`schedule_id`) REFERENCES `schedules` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `shift_requests_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `users`
--
ALTER TABLE `users`
  ADD CONSTRAINT `users_ibfk_1` FOREIGN KEY (`branch_id`) REFERENCES `branches` (`id`) ON DELETE SET NULL;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
