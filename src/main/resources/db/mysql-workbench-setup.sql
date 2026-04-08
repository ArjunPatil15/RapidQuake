-- RapidQuake — run in MySQL Workbench as root (or another admin with GRANT privilege).
-- spring.datasource.username / spring.datasource.password must match the password set below.

CREATE DATABASE IF NOT EXISTS rapidquake
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------------
-- App user: DROP + CREATE fixes "Access denied" when IF NOT EXISTS skipped
-- updating an existing wrong password. Password here = rapidquake
-- (change in application.properties too if you change it below).
-- ---------------------------------------------------------------------------
DROP USER IF EXISTS 'rapidquake'@'localhost';
DROP USER IF EXISTS 'rapidquake'@'127.0.0.1';
DROP USER IF EXISTS 'rapidquake'@'%';

CREATE USER 'rapidquake'@'localhost' IDENTIFIED BY 'rapidquake';
CREATE USER 'rapidquake'@'127.0.0.1' IDENTIFIED BY 'rapidquake';
CREATE USER 'rapidquake'@'%' IDENTIFIED BY 'rapidquake';

GRANT ALL PRIVILEGES ON rapidquake.* TO 'rapidquake'@'localhost';
GRANT ALL PRIVILEGES ON rapidquake.* TO 'rapidquake'@'127.0.0.1';
GRANT ALL PRIVILEGES ON rapidquake.* TO 'rapidquake'@'%';
FLUSH PRIVILEGES;

USE rapidquake;

-- ---------------------------------------------------------------------------
-- Family relation persistence (safe to run multiple times)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS family_relations (
  id BIGINT NOT NULL AUTO_INCREMENT,
  requester_id BIGINT NOT NULL,
  target_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  created_at DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
  accepted_at DATETIME(6) NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_family_rel_requester FOREIGN KEY (requester_id) REFERENCES app_users(id) ON DELETE CASCADE,
  CONSTRAINT fk_family_rel_target FOREIGN KEY (target_id) REFERENCES app_users(id) ON DELETE CASCADE,
  CONSTRAINT chk_family_rel_status CHECK (status IN ('PENDING', 'ACCEPTED')),
  CONSTRAINT chk_family_rel_not_self CHECK (requester_id <> target_id),
  CONSTRAINT uk_family_rel_pair UNIQUE (requester_id, target_id)
);

CREATE INDEX idx_family_rel_requester_status ON family_relations (requester_id, status);
CREATE INDEX idx_family_rel_target_status ON family_relations (target_id, status);

-- Test in Workbench: new connection, 127.0.0.1, user rapidquake, password rapidquake, schema rapidquake
