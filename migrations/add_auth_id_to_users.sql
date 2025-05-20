-- Añadir columna auth_id a la tabla users si no existe
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_id UUID REFERENCES auth.users(id);

-- Crear un índice para mejorar el rendimiento de las consultas por auth_id
CREATE INDEX IF NOT EXISTS idx_users_auth_id ON public.users(auth_id);
