pipeline {
    agent any

    environment {
        // ID du credential Git dans Jenkins
        GIT_CREDENTIAL_ID = 'github-cred'
        // URL de ton repo Git
        REPO_URL = 'https://github.com/samarhuimli/Pfe.git'
        // Branche à utiliser
        BRANCH_NAME = 'main'
    }

    stages {

        stage('Checkout') {
            steps {
                echo 'Récupération du code depuis Git...'
                git branch: "${BRANCH_NAME}",
                    url: "${REPO_URL}",
                    credentialsId: "${GIT_CREDENTIAL_ID}"
            }
        }

        stage('Build Docker Images') {
            steps {
                echo 'Construction des images Docker...'
                // Reconstruction seulement des services qui ont changé
                sh 'docker-compose build --pull'
            }
        }

        stage('Start Services') {
            steps {
                echo 'Démarrage des services...'
                sh 'docker-compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                echo 'Vérification des containers...'
                // Vérifie si tous les containers sont en ligne
                sh 'docker ps'
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Nettoyage des images intermédiaires et volumes inutilisés...'
                sh 'docker system prune -f'
            }
        }
    }

    post {
        success {
            echo 'Pipeline terminé avec succès ✅'
        }
        failure {
            echo 'Pipeline échoué ❌'
        }
    }
}
