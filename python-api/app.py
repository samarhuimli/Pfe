from flask import Flask, request, jsonify
import subprocess
import sys
import psycopg2
import os
import json

app = Flask(__name__)

# Configuration de la connexion à PostgreSQL à partir des variables d'environnement
def get_db_connection():
    return psycopg2.connect(
        dbname=os.getenv("POSTGRES_DB"),
        user=os.getenv("POSTGRES_USER"),
        password=os.getenv("POSTGRES_PASSWORD"),
        host=os.getenv("POSTGRES_HOST"),
        port=os.getenv("POSTGRES_PORT")
    )

@app.route('/execute', methods=['POST'])
def execute():
    data = request.get_json()
    code = data.get('code')
    print(f"Script reçu : {code}")  # Log du script reçu

    if not code:
        return jsonify({'error': 'Erreur: Le code Python est vide ou absent', 'status': 'FAILED'}), 400

    try:
        # Préparer un environnement sécurisé pour exécuter le script
        exec_globals = {
            'psycopg2': psycopg2,
            'get_db_connection': get_db_connection,
            'json': json
        }

        # Exécuter le script Python dans un environnement contrôlé
        exec_locals = {}
        exec(code, exec_globals, exec_locals)
        print(f"Variables locales après exécution : {exec_locals}")  # Log des variables locales

        # Capturer les résultats (par exemple, une variable 'result' définie dans le script)
        output = exec_locals.get('result', 'No output')

        return jsonify({
            'output': str(output),
            'error': '',
            'status': 'SUCCESS'
        })

    except Exception as e:
        print(f"Erreur lors de l'exécution : {str(e)}")  # Log de l'erreur
        return jsonify({'error': f'Erreur: {str(e)}', 'status': 'FAILED'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8083, debug=True)  # Activer le mode debug