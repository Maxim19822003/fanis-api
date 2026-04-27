-- Создание таблиц для Фанис

-- Поломки
CREATE TABLE IF NOT EXISTS breakdowns (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    emoji VARCHAR(10) DEFAULT '🔧',
    steps TEXT[] NOT NULL DEFAULT '{}',
    video_url VARCHAR(500) DEFAULT '',
    image_url VARCHAR(500) DEFAULT '',
    extra TEXT DEFAULT '',
    contact VARCHAR(20) DEFAULT 'fanis',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Коды ошибок
CREATE TABLE IF NOT EXISTS errors (
    id SERIAL PRIMARY KEY,
    system VARCHAR(20) NOT NULL,
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    period VARCHAR(200) DEFAULT '',
    solution TEXT[] NOT NULL DEFAULT '{}',
    image_url VARCHAR(500) DEFAULT '',
    contact VARCHAR(20) DEFAULT 'fanis',
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Контакты
CREATE TABLE IF NOT EXISTS contacts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Настройки (пароль админки)
CREATE TABLE IF NOT EXISTS settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(50) NOT NULL UNIQUE,
    value TEXT NOT NULL
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_breakdowns_active ON breakdowns(active);
CREATE INDEX IF NOT EXISTS idx_errors_system ON errors(system);
CREATE INDEX IF NOT EXISTS idx_errors_code ON errors(code);
CREATE INDEX IF NOT EXISTS idx_errors_active ON errors(active);

-- Начальные данные: контакты
INSERT INTO contacts (name, phone) VALUES 
    ('fanis', '+79991234567'),
    ('vildan', '+79997654321')
ON CONFLICT (name) DO NOTHING;

-- Начальные данные: пароль (bcrypt hash для "fanis2024")
INSERT INTO settings (key, value) VALUES 
    ('admin_password', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi')
ON CONFLICT (key) DO NOTHING;
