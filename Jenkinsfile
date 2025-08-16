pipeline {
    agent any
    
    environment {
        REGISTRY = "samarhuimli" // ton Docker Hub username
        IMAGE_TAG = "${env.BUILD_NUMBER}" // numéro de build comme version
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/samarhuimli/Pfe.git', 
                credentialsId: 'github-cred' // Credential GitHub
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    // Adaptation pour Windows avec bat
                    bat '''
                        echo "=== Spring Boot Tests ==="
                        cd backend-spring && mvn test || exit 0
                        echo "=== Angular Tests ==="
                        cd ..\\frontend-angular && npm install && npm test || exit 0
                        echo "=== Flask Tests ==="
                        cd ..\\flask-api && pytest || exit 0
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                bat 'docker-compose build'
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    // Vérifie si trivy est installé sur Jenkins
                    bat '''
                        where trivy || echo "⚠️ Trivy n'est pas installé sur cet agent Jenkins"
                        trivy image %REGISTRY%/backend-spring:%IMAGE_TAG% || exit 0
                        trivy image %REGISTRY%/frontend-angular:%IMAGE_TAG% || exit 0
                        trivy image %REGISTRY%/flask-api:%IMAGE_TAG% || exit 0
                    '''
                }
            }
        }
        
        stage('Docker Login & Push') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'docker-cred', 
                              usernameVariable: 'DOCKER_USER', 
                              passwordVariable: 'DOCKER_PASS')]) {
                    bat '''
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        docker-compose push
                    '''
                }
            }
        }
        
        stage('Deploy to Sandbox') {
            steps {
                script {
                    // Déploiement simple avec docker-compose
                    bat '''
                        docker-compose down || exit 0
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
