-- Migration: Admin System for SaaS
-- Adds roles, plans, subscriptions, usage tracking, and audit logging

-- Add role and ban columns to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ban_reason TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_at TIMESTAMP WITH TIME ZONE;

-- Plans d'abonnement
CREATE TABLE IF NOT EXISTS plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    slug VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10,2) DEFAULT 0,
    max_projects INT DEFAULT 5,
    max_exports_per_month INT DEFAULT 10,
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Abonnements utilisateurs
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id),
    status VARCHAR(20) DEFAULT 'active',
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Statistiques d'utilisation
CREATE TABLE IF NOT EXISTS usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    month DATE NOT NULL,
    projects_created INT DEFAULT 0,
    exports_count INT DEFAULT 0,
    UNIQUE(user_id, month)
);

-- Journal d'audit admin
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id UUID,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insérer plans par défaut (seulement si la table est vide)
INSERT INTO plans (name, slug, description, price_monthly, max_projects, max_exports_per_month, features)
SELECT * FROM (VALUES
    ('Gratuit', 'free', 'Plan gratuit avec fonctionnalités de base', 0::DECIMAL, 3, 5, '["Éditeur complet", "Export PDF"]'::JSONB),
    ('Pro', 'pro', 'Pour les brasseurs réguliers', 9.99::DECIMAL, 20, 50, '["Éditeur complet", "Export PDF", "Templates premium", "Support prioritaire"]'::JSONB),
    ('Business', 'business', 'Pour les brasseries professionnelles', 29.99::DECIMAL, -1, -1, '["Projets illimités", "Exports illimités", "Templates premium", "Support prioritaire", "API access"]'::JSONB)
) AS v(name, slug, description, price_monthly, max_projects, max_exports_per_month, features)
WHERE NOT EXISTS (SELECT 1 FROM plans LIMIT 1);

-- Index pour performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_banned ON users(is_banned);
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_month ON usage_stats(user_id, month);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin_id ON audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_target ON audit_log(target_type, target_id);

-- Fonction pour assigner automatiquement le plan gratuit aux nouveaux utilisateurs
CREATE OR REPLACE FUNCTION assign_free_plan_to_new_user()
RETURNS TRIGGER AS $$
DECLARE
    free_plan_id UUID;
BEGIN
    SELECT id INTO free_plan_id FROM plans WHERE slug = 'free' LIMIT 1;
    IF free_plan_id IS NOT NULL THEN
        INSERT INTO subscriptions (user_id, plan_id, status, current_period_end)
        VALUES (NEW.id, free_plan_id, 'active', NULL)
        ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour assigner plan gratuit
DROP TRIGGER IF EXISTS trigger_assign_free_plan ON users;
CREATE TRIGGER trigger_assign_free_plan
    AFTER INSERT ON users
    FOR EACH ROW
    EXECUTE FUNCTION assign_free_plan_to_new_user();

-- Assigner le plan gratuit aux utilisateurs existants qui n'ont pas d'abonnement
INSERT INTO subscriptions (user_id, plan_id, status)
SELECT u.id, p.id, 'active'
FROM users u
CROSS JOIN plans p
WHERE p.slug = 'free'
  AND NOT EXISTS (SELECT 1 FROM subscriptions s WHERE s.user_id = u.id);
