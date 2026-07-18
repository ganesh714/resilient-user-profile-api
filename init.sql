CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    registrationDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial test data
INSERT INTO users (id, name, email) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Alice Smith', 'alice@example.com'),
    ('22222222-2222-2222-2222-222222222222', 'Bob Jones', 'bob@example.com'),
    ('33333333-3333-3333-3333-333333333333', 'Charlie Brown', 'charlie@example.com');
