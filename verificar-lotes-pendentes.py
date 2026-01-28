import psycopg2
import os
from dotenv import load_dotenv

# Carregar variáveis de ambiente
load_dotenv('.env.development')

def verificar_lotes_pendentes():
    try:
        # Conectar ao banco de dados PostgreSQL
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'nr-bps_db'),
            user=os.getenv('DB_USER', 'postgres'),
            password=os.getenv('DB_PASSWORD', '123456')
        )
        cur = conn.cursor()
        
        # Consultar lotes concluídos sem laudo ou com laudo em rascunho
        cur.execute('''
            SELECT la.id, la.codigo, la.status, la.emitido_em, l.id as laudo_id, l.status as status_laudo
            FROM lotes_avaliacao la
            LEFT JOIN laudos l ON la.id = l.lote_id
            WHERE la.status = 'concluido' AND (l.id IS NULL OR l.status = 'rascunho')
            ORDER BY la.finalizado_em DESC
            LIMIT 5;
        ''')
        
        lotes_pendentes = cur.fetchall()
        print(f'Encontrados {len(lotes_pendentes)} lotes pendentes:')
        for lote in lotes_pendentes:
            print(f'ID: {lote[0]} | Código: {lote[1]} | Status: {lote[2]}')
            print(f'Emitido em: {lote[3]} | Laudo ID: {lote[4]} | Status Laudo: {lote[5]}')
            print('---')
        
        # Verificar emissores ativos
        cur.execute('''
            SELECT cpf, nome, ativo FROM funcionarios WHERE perfil = 'emissor' AND ativo = true;
        ''')
        
        emissores = cur.fetchall()
        print(f'\nEmissores ativos: {len(emissores)}')
        for emissor in emissores:
            print(f'CPF: {emissor[0]} | Nome: {emissor[1]} | Ativo: {emissor[2]}')
        
        # Fechar conexão
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f'Erro ao conectar ao banco de dados: {e}')

if __name__ == '__main__':
    verificar_lotes_pendentes()
