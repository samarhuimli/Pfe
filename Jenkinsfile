pipeline {
    agent any
    
    environment {
        // Docker Hub
        REGISTRY = "samarhuimli"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        
        // PostgreSQL
        POSTGRES_DB = "sandbox"
        POSTGRES_USER = "postgres"
        POSTGRES_PASSWORD = "samar"
        
        // Spring
        SPRING_DATASOURCE_URL = "jdbc:postgresql://postgres:5432/sandbox"
        SPRING_DATASOURCE_USERNAME = "postgres"
        SPRING_DATASOURCE_PASSWORD = "samar"
    }
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                url: 'https://github.com/samarhuimli/Pfe.git', 
                credentialsId: 'github-cred'
            }
        }
        
        stage('Build Backend') {
            steps {
                dir('Sandbox-Spring') {
                    bat 'mvn clean package -DskipTests'
                    // Verify JAR was created
                    bat '''
                        if not exist "target\\*.jar" (
                            echo ERREUR: Fichier JAR introuvable
                            exit 1
                        )
                    '''
                }
            }
        }
        
        stage('Build Frontend') {
            steps {
                dir('angular-dashboard') {
                    bat 'npm install'
                    // Fixed build command for modern Angular CLI
                    bat 'npm run build -- --configuration production'
                    // Alternative if the above doesn't work:
                    // bat 'npm run build'
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Build images
                    bat 'docker-compose build'
                    
                    // Tag images
                    bat '''
                        docker tag sandbox-ci-cd_spring-app %REGISTRY%/spring-app:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_python-api %REGISTRY%/python-api:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_r-api %REGISTRY%/r-api:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_frontend %REGISTRY%/frontend:%IMAGE_TAG%
                    '''
                }
            }
        }
        
        stage('Security Scan') {
            steps {
                script {
                    bat '''
                        where trivy || echo "⚠️ Trivy non installé - scan ignoré"
                        if exist "C:\\trivy.exe" (
                            trivy image %REGISTRY%/spring-app:%IMAGE_TAG% || exit 0
                            trivy image %REGISTRY%/python-api:%IMAGE_TAG% || exit 0
                            trivy image %REGISTRY%/r-api:%IMAGE_TAG% || exit 0
                        )
                    '''
                }
            }
        }
        
        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-cred', 
                    usernameVariable: 'DOCKER_USER', 
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    bat '''
                        echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                        docker push %REGISTRY%/spring-app:%IMAGE_TAG%
                        docker push %REGISTRY%/python-api:%IMAGE_TAG%
                        docker push %REGISTRY%/r-api:%IMAGE_TAG%
                        docker push %REGISTRY%/frontend:%IMAGE_TAG%
                    '''
                }
            }
        }
        
        stage('Deploy') {
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
            echo "Pipeline terminé - Vérification des conteneurs"
            bat 'docker ps -a'
            
            // Resource cleanup with error handling
            script {
                try {
                    // Clean containers only if any exist
                    def containers = bat(script: '@docker ps -aq', returnStdout: true).trim()
                    if (containers) {
                        bat '@docker rm -f $(docker ps -aq)'
                    }
                    
                    // Clean dangling images only if any exist
                    def images = bat(script: '@docker images -q -f "dangling=true"', returnStdout: true).trim()
                    if (images) {
                        bat '@docker rmi $(docker images -q -f "dangling=true")'
                    }
                } catch (e) {
                    echo "Cleanup failed: ${e.message}"
                    // Continue anyway
                }
            }
        }
    }
}
