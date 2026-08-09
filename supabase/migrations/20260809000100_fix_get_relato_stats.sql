CREATE OR REPLACE FUNCTION get_relato_stats()
RETURNS JSON AS $$
BEGIN
    RETURN json_build_object(
        'total', (SELECT COUNT(*) FROM relatos),
        'por_tipo', COALESCE((
            SELECT jsonb_object_agg(tipo, total)
            FROM (SELECT tipo, COUNT(*) AS total FROM relatos GROUP BY tipo) AS tipos
        ), '{}'::jsonb),
        'por_status', COALESCE((
            SELECT jsonb_object_agg(status, total)
            FROM (SELECT status, COUNT(*) AS total FROM relatos GROUP BY status) AS statuses
        ), '{}'::jsonb),
        'por_severidade', COALESCE((
            SELECT jsonb_object_agg(severidade, total)
            FROM (SELECT severidade, COUNT(*) AS total FROM relatos GROUP BY severidade) AS severidades
        ), '{}'::jsonb)
    );
END;
$$ LANGUAGE plpgsql;