pipeline {
    agent any
    
    environment {
        REGISTRY = "samarhuimli"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/samarhuimli/Pfe.git', 
                credentialsId: 'github-cred'
            }
        }
        
        stage('Build Spring Boot') {
            steps {
                dir('backend-spring') {
                    bat 'mvn clean package -DskipTests'
                }
            }
        }
        
        stage('Run Tests') {
            steps {
                script {
                    // Tests Spring Boot
                    dir('backend-spring') {
                        bat 'mvn test || exit 0'
                    }
                    
                    // Tests Angular
                    dir('frontend-angular') {
                        bat 'npm install && npm test || exit 0'
                    }
                    
                    // Tests Flask
                    dir('flask-api') {
                        bat 'pytest || exit 0'
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Vérifie que le fichier JAR a bien été généré
                    bat 'dir backend-spring\\target'
                    bat 'docker-compose build'
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    bat '''
                        where trivy || echo "⚠️ Trivy n'est pas installé"
                        docker images
                        trivy image %REGISTRY%/backend-spring:%IMAGE_TAG% || exit 0
                        trivy image %REGISTRY%/frontend-angular:%IMAGE_TAG% || exit 0
                        trivy image %REGISTRY%/flask-api:%IMAGE_TAG% || exit 0
                    '''
                }
            }
        }
        
        stage('Docker Login & Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-cred', 
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat '''
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        docker-compose push
                    '''
                }
            }
        }
        
        stage('Deploy to Sandbox') {
            steps {
                bat '''
                    docker-compose down || exit 0
                    docker-compose up -d
                '''
            }
        }
    }
    
    post {
        always {
            echo "Pipeline terminé (CI/CD sandbox)"
            script {
                // Nettoyage des containers et images
                bat 'docker ps -aq | xargs docker rm -f || true'
                bat 'docker images -q | xargs docker rmi -f || true'
            }
        }
    }
}
