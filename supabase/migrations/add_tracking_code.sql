-- supabase/migrations/add_tracking_code.sql
-- Adicionar coluna de código de rastreamento à tabela relatos

ALTER TABLE relatos 
ADD COLUMN IF NOT EXISTS tracking_code VARCHAR(20) UNIQUE;

-- Criar índice para busca rápida
CREATE INDEX IF NOT EXISTS relatos_tracking_code_idx ON relatos(tracking_code);

-- Função para gerar estatísticas (usado pela Edge Function)
CREATE OR REPLACE FUNCTION get_relato_stats()
RETURNS JSON AS $$
DECLARE
    total_count INT;
    por_tipo JSONB;
    por_status JSONB;
    por_severidade JSONB;
BEGIN
    SELECT COUNT(*) INTO total_count FROM relatos;
    
    SELECT jsonb_object_agg(tipo, COUNT(*)) INTO por_tipo
    FROM relatos
    GROUP BY tipo;
    
    SELECT jsonb_object_agg(status, COUNT(*)) INTO por_status
    FROM relatos
    GROUP BY status;
    
    SELECT jsonb_object_agg(severidade, COUNT(*)) INTO por_severidade
    FROM relatos
    GROUP BY severidade;
    
    RETURN jsonb_build_object(
        'total', total_count,
        'por_tipo', COALESCE(por_tipo, '{}'::jsonb),
        'por_status', COALESCE(por_status, '{}'::jsonb),
        'por_severidade', COALESCE(por_severidade, '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;
