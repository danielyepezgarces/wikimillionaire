-- Create answer_reports table for storing user-reported incorrect answers
-- This table will be used to track issues with questions and answers in the game

CREATE TABLE IF NOT EXISTS answer_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id VARCHAR(255),
  question TEXT NOT NULL,
  selected_answer TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  reason ENUM('incorrect_answer', 'outdated_data', 'ambiguous_question', 'other') NOT NULL,
  description TEXT,
  username VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  timestamp DATETIME NOT NULL,
  status ENUM('pending', 'reviewed', 'resolved', 'rejected') DEFAULT 'pending',
  wikidata_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_status (status),
  INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add comment to table
ALTER TABLE answer_reports COMMENT = 'Stores user-reported incorrect answers for review and Wikidata integration';
