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
        password=os.getenv("POSTGRES_PASSWORD", "samar"),  # Remplacez par un secret si sécurisé
        host=os.getenv("POSTGRES_HOST", "postgres"),
        port=os.getenv("POSTGRES_PORT", "5432")
    )
    app.logger.info("Connexion réussie !")
    return conn

def is_safe_operation(query):
    allowed = {"SELECT", "UPDATE"}
    operation = query.split()[0].upper()
    app.logger.info(f"Vérification de l'opération : {operation}, autorisées : {allowed}")
    return operation in allowed

@app.route('/connect', methods=['GET'])
def test_connection():
    conn = get_db_connection()
    app.logger.info("Connexion réussie !")
    app.logger.info(conn)
    return "Connexion"

@app.route('/execute', methods=['POST'])
def execute():
    app.logger.info("Requête POST reçue sur /execute")
    # Tenter de parser le JSON avec une gestion d'erreur
    try:
        data = request.get_json()
        if not data:
            app.logger.info("Erreur : Corps de la requête vide ou non JSON")
            return jsonify({'error': 'Corps de la requête vide ou mal formé', 'status': 'FAILED', 'output': ''}), 400
    except Exception as e:
        app.logger.error(f"Échec du parsing JSON : {str(e)}")
        return jsonify({'error': f'JSON invalide : {str(e)}', 'status': 'FAILED', 'output': ''}), 400

    app.logger.info(f"Données reçues : {data}")
    code = data.get('code')
    app.logger.info(f"Script reçu : {code}")

    if not code:
        app.logger.info("Erreur : code vide ou absent")
        return jsonify({'error': 'Erreur: Le code Python est vide ou absent', 'status': 'FAILED', 'output': ''}), 400

    output_buffer = io.StringIO()
    original_stdout = sys.stdout

    try:
        sys.stdout = output_buffer
        conn = get_db_connection()
        exec_globals = {'conn': conn, 'psycopg2': psycopg2, 'json': json, '__builtins__': __builtins__}
        exec_locals = {}

        app.logger.info("Avant exécution du code")
        import re
        match = re.search(r'cursor\.execute\("([^"]*)"\)', code)
        if match:
            query = match.group(1)
            if not is_safe_operation(query):
                app.logger.error(f"Opération interdite détectée : {query.split()[0]}")
                return jsonify({'error': f'Opération interdite : {query.split()[0]}', 'status': 'FAILED', 'output': ''}), 400

        exec(code, exec_globals, exec_locals)
        app.logger.info("Après exécution du code")

        output = output_buffer.getvalue().strip()
        app.logger.info(f"Sortie capturée (stdout) : {output}")
        result = exec_locals.get('result', output if output else 'No output')
        app.logger.info(f"Résultat final : {result}")

        return jsonify({
            'output': str(result) if result != 'No output' else result,
            'error': '',
            'status': 'SUCCESS'
        })

    except Exception as e:
        app.logger.error(f"Erreur lors de l'exécution : {str(e)}")
        if 'conn' in locals():
            conn.close()
        return jsonify({'error': f'Erreur: {str(e)}', 'status': 'FAILED', 'output': ''}), 500

    finally:
        sys.stdout = original_stdout
        output_buffer.close()
        if 'conn' in locals():
            conn.close()

if __name__ == '__main__':
    app.logger.info("Démarrage du serveur Flask...")
    app.run(host='0.0.0.0', port=8083, debug=True)