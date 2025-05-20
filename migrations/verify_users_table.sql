-- Verificar si la tabla users existe
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public'
   AND table_name = 'users'
);

-- Verificar las columnas de la tabla users
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users';

-- Verificar si la columna auth_id existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public'
   AND table_name = 'users'
   AND column_name = 'auth_id'
);

-- Si la columna auth_id no existe, añadirla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'auth_id'
    ) THEN
        ALTER TABLE users ADD COLUMN auth_id UUID;
        CREATE INDEX idx_users_auth_id ON users(auth_id);
    END IF;
END
$$;

-- Verificar si la columna wikimedia_id existe
SELECT EXISTS (
   SELECT FROM information_schema.columns 
   WHERE table_schema = 'public'
   AND table_name = 'users'
   AND column_name = 'wikimedia_id'
);

-- Si la columna wikimedia_id no existe, añadirla
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users'
        AND column_name = 'wikimedia_id'
    ) THEN
        ALTER TABLE users ADD COLUMN wikimedia_id TEXT;
        CREATE INDEX idx_users_wikimedia_id ON users(wikimedia_id);
    END IF;
END
$$;
