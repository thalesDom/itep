-- ITEP — estrutura do banco (MySQL 5.7+ / MariaDB 10.3+). Charset utf8mb4.
CREATE TABLE IF NOT EXISTS settings (
    k VARCHAR(40) NOT NULL,
    v TEXT NOT NULL,
    PRIMARY KEY (k)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS courses (
    `key` VARCHAR(60) NOT NULL,
    dir VARCHAR(60) NOT NULL,
    name VARCHAR(120) NOT NULL,
    area VARCHAR(30) NOT NULL,
    img VARCHAR(300) NOT NULL DEFAULT '',
    obj VARCHAR(600) NOT NULL DEFAULT '',
    obj1 VARCHAR(400) NOT NULL DEFAULT '',
    sort INT NOT NULL DEFAULT 0,
    PRIMARY KEY (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cities (
    dir VARCHAR(60) NOT NULL,
    name VARCHAR(120) NOT NULL,
    address VARCHAR(200) NOT NULL DEFAULT '',
    phone VARCHAR(20) NOT NULL DEFAULT '',
    instagram VARCHAR(200) NOT NULL DEFAULT '',
    facebook VARCHAR(200) NOT NULL DEFAULT '',
    map_query VARCHAR(120) NOT NULL DEFAULT '',
    sort INT NOT NULL DEFAULT 0,
    PRIMARY KEY (dir)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS city_courses (
    city_dir VARCHAR(60) NOT NULL,
    course_key VARCHAR(60) NOT NULL,
    PRIMARY KEY (city_dir, course_key),
    CONSTRAINT fk_cc_city FOREIGN KEY (city_dir) REFERENCES cities (dir) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT fk_cc_course FOREIGN KEY (course_key) REFERENCES courses (`key`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS posts (
    id VARCHAR(20) NOT NULL,
    slug VARCHAR(80) NOT NULL,
    cat VARCHAR(40) NOT NULL DEFAULT 'Geral',
    title VARCHAR(140) NOT NULL,
    img VARCHAR(300) NOT NULL DEFAULT '',
    body_json MEDIUMTEXT NOT NULL,
    cta_text VARCHAR(60) NOT NULL DEFAULT '',
    cta_href VARCHAR(300) NOT NULL DEFAULT '',
    published TINYINT(1) NOT NULL DEFAULT 0,
    sort INT NOT NULL DEFAULT 0,
    updated_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_posts_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS leads (
    id CHAR(12) NOT NULL,
    created_at DATETIME NOT NULL,
    status ENUM('novo','contatado','matriculado','arquivado') NOT NULL DEFAULT 'novo',
    notes VARCHAR(1000) NOT NULL DEFAULT '',
    name VARCHAR(120) NOT NULL,
    phone VARCHAR(30) NOT NULL DEFAULT '',
    email VARCHAR(140) NOT NULL DEFAULT '',
    age VARCHAR(4) NOT NULL DEFAULT '',
    city VARCHAR(80) NOT NULL DEFAULT '',
    course VARCHAR(120) NOT NULL DEFAULT '',
    subject VARCHAR(160) NOT NULL DEFAULT '',
    message TEXT NOT NULL,
    source VARCHAR(160) NOT NULL DEFAULT '',
    PRIMARY KEY (id),
    KEY idx_leads_created (created_at),
    KEY idx_leads_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS admin_users (
    id TINYINT UNSIGNED NOT NULL,
    pass_hash VARCHAR(255) NOT NULL,
    updated_at DATETIME NOT NULL,
    PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rate_limits (
    k VARCHAR(80) NOT NULL,
    t INT UNSIGNED NOT NULL,
    KEY idx_rate (k, t)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
