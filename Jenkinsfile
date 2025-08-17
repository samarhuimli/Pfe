pipeline {
    agent any
    
    environment {
        REGISTRY = "samarhuimli"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        POSTGRES_DB = "sandbox"
        POSTGRES_USER = "postgres"
        POSTGRES_PASSWORD = "samar"
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
                    bat 'npm run build -- --configuration production'
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    bat 'docker-compose build --no-cache'
                    bat 'docker images'
                    
                    // Vérification et tagging avec débogage
                    bat '''
                        echo Tagging images with REGISTRY=%REGISTRY% and IMAGE_TAG=%IMAGE_TAG%
                        if docker images -q sandbox-ci-cd-spring-app:latest >nul 2>&1 (
                            docker tag sandbox-ci-cd-spring-app "%REGISTRY%/spring-app:%IMAGE_TAG%"
                            docker tag sandbox-ci-cd-spring-app "%REGISTRY%/spring-app:latest"
                        ) else (
                            echo ERREUR: Image sandbox-ci-cd-spring-app non trouvée
                            exit 1
                        )
                        if docker images -q sandbox-ci-cd-python-api:latest >nul 2>&1 (
                            docker tag sandbox-ci-cd-python-api "%REGISTRY%/python-api:%IMAGE_TAG%"
                            docker tag sandbox-ci-cd-python-api "%REGISTRY%/python-api:latest"
                        ) else (
                            echo ERREUR: Image sandbox-ci-cd-python-api non trouvée
                            exit 1
                        )
                        if docker images -q sandbox-ci-cd-r-api:latest >nul 2>&1 (
                            docker tag sandbox-ci-cd-r-api "%REGISTRY%/r-api:%IMAGE_TAG%"
                            docker tag sandbox-ci-cd-r-api "%REGISTRY%/r-api:latest"
                        ) else (
                            echo ERREUR: Image sandbox-ci-cd-r-api non trouvée
                            exit 1
                        )
                        if docker images -q sandbox-ci-cd-frontend:latest >nul 2>&1 (
                            docker tag sandbox-ci-cd-frontend "%REGISTRY%/frontend:%IMAGE_TAG%"
                            docker tag sandbox-ci-cd-frontend "%REGISTRY%/frontend:latest"
                        ) else (
                            echo ERREUR: Image sandbox-ci-cd-frontend non trouvée
                            exit 1
                        )
                        docker images
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
                        docker push %REGISTRY%/spring-app:latest
                        docker push %REGISTRY%/python-api:latest
                        docker push %REGISTRY%/r-api:latest
                        docker push %REGISTRY%/frontend:latest
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
            
            script {
                try {
                    def containers = bat(script: '@docker ps -aq -f "status=exited"', returnStdout: true).trim()
                    if (containers) {
                        bat '@docker rm -f $(docker ps -aq -f "status=exited")'
                    }
                    def images = bat(script: '@docker images -q -f "dangling=true"', returnStdout: true).trim()
                    if (images) {
                        bat '@docker rmi $(docker images -q -f "dangling=true")'
                    }
                } catch (e) {
                    echo "Cleanup failed: ${e.message}"
                }
            }
        }
        
        failure {
            emailext body: 'Le build ${BUILD_STATUS}\nVoir les détails: ${BUILD_URL}',
                    subject: 'Échec du build Jenkins',
                    to: 'huimlisamar@gmail.com'
        }
    }
}
