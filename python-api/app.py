from flask import Flask, request, jsonify
import sys
import io
import psycopg2
import os
import json

app = Flask(__name__)

def get_db_connection():
    app.logger.info("Tentative de connexion à PostgreSQL...")
    app.logger.info(os.getenv("POSTGRES_DB"))
    conn = psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB", "sandbox"),
        user=os.getenv("POSTGRES_USER", "postgres"),
        password=os.getenv("POSTGRES_PASSWORD", "samar"),
        host=os.getenv("POSTGRES_HOST", "postgres"),
        port=os.getenv("POSTGRES_PORT", "5432")
    )
    app.logger.info("Connexion réussie !")
    return conn

@app.route('/connect', methods=['GET'])
def test_connection():
    conn = get_db_connection()
    app.logger.info("Connexion réussie !")
    app.logger.info(conn)
    return "Connexion"
    
@app.route('/execute', methods=['POST'])
def execute():
    app.logger.info("Requête POST reçue sur /execute")
    data = request.get_json()
    app.logger.info(f"Données reçues : {data}")
    code = data.get('code')
    app.logger.info(f"Script reçu : {code}")

    if not code:
        app.logger.info("Erreur : code vide ou absent")
        return jsonify({'error': 'Erreur: Le code Python est vide ou absent', 'status': 'FAILED'}), 400

    output_buffer = io.StringIO()
    original_stdout = sys.stdout

    try:
        sys.stdout = output_buffer
        exec_globals = {
            'psycopg2': psycopg2,
            'get_db_connection': get_db_connection,
            'json': json,
            '__builtins__': __builtins__,
        }
        exec_locals = {}
        app.logger.info("Avant exécution du code")
        exec(code, exec_globals, exec_locals)
        app.logger.info("Après exécution du code")

        output = output_buffer.getvalue().strip()
        app.logger.info(f"Sortie capturée (stdout) : {output}")

        # Prioriser 'result' défini dans le script, sinon utiliser la sortie de print
        result = exec_locals.get('result', output if output else 'No output')
        app.logger.info(f"Résultat final : {result}")

        return jsonify({
            'output': str(result) if result != 'No output' else result,
            'error': '',
            'status': 'SUCCESS'
        })

    except Exception as e:
        app.logger.error(f"Erreur lors de l'exécution : {str(e)}")
        return jsonify({'error': f'Erreur: {str(e)}', 'status': 'FAILED'}), 500

    finally:
        sys.stdout = original_stdout
        output_buffer.close()

if __name__ == '__main__':
    app.logger.info("Démarrage du serveur Flask...")
    app.run(host='0.0.0.0', port=8083, debug=True)