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
                    // Vérification que le JAR est bien généré
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
                    bat 'npm run build -- --configuration=production'                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    // Construction des images
                    bat 'docker-compose build'
                    
                    // Tagging des images
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
            
            // Nettoyage des ressources
            script {
                bat '''
                    for /f "tokens=*" %%i in ('docker ps -aq') do docker rm -f %%i
                    for /f "tokens=*" %%i in ('docker images -q -f "dangling=true"') do docker rmi %%i
                '''
            }
        }
    }
}
