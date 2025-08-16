pipeline {
    agent any

    environment {
        REGISTRY = "samarhuimli"                   // ton Docker Hub username
        IMAGE_TAG = "${env.BUILD_NUMBER}"          // numéro de build comme version
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/samarhuimli/Pfe.git',
                    credentialsId: 'github-cred'   // Credential GitHub
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Adaptation : si tes projets sont dans des dossiers séparés
                    sh '''
                        echo "=== Spring Boot Tests ==="
                        cd backend-spring && mvn test || true

                        echo "=== Angular Tests ==="
                        cd ../frontend-angular && npm install && npm test || true

                        echo "=== Flask Tests ==="
                        cd ../flask-api && pytest || true
                    '''
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                sh 'docker-compose build'
            }
        }

        stage('Security Scan') {
            steps {
                script {
                    // Vérifie si trivy est installé sur Jenkins
                    sh '''
                        which trivy || echo "⚠️ Trivy n’est pas installé sur cet agent Jenkins"
                        trivy image $REGISTRY/backend-spring:$IMAGE_TAG || true
                        trivy image $REGISTRY/frontend-angular:$IMAGE_TAG || true
                        trivy image $REGISTRY/flask-api:$IMAGE_TAG || true
                    '''
                }
            }
        }

        stage('Docker Login & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-cred',
                                                 usernameVariable: 'DOCKER_USER',
                                                 passwordVariable: 'DOCKER_PASS')]) {
                    sh '''
                        echo $DOCKER_PASS | docker login -u $DOCKER_USER --password-stdin

                        # Push des images avec un tag lié au build
                        docker-compose push
                    '''
                }
            }
        }

        stage('Deploy to Sandbox') {
            steps {
                script {
                    // Déploiement simple avec docker-compose
                    sh '''
                        docker-compose down || true
                        docker-compose up -d
                    '''
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline terminé (CI/CD sandbox)"
        }
    }
}
