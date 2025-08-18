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
        
        // Optimisation Docker
        DOCKER_BUILDKIT = "1"
        COMPOSE_DOCKER_CLI_BUILD = "1"
    }
    
    options {
        timeout(time: 1, unit: 'HOURS')
        disableConcurrentBuilds()
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
                    // Construction avec timeout
                    timeout(time: 30, unit: 'MINUTES') {
                        bat 'docker-compose build --no-cache'
                    }
                    
                    // Vérification des images
                    bat '''
                        echo Liste des images disponibles:
                        docker images
                        
                        echo Vérification des images construites...
                        docker inspect sandbox-ci-cd_spring-app >nul 2>&1 || (
                            echo ERREUR: Image spring-app non trouvée
                            exit 1
                        )
                        docker inspect sandbox-ci-cd_python-api >nul 2>&1 || (
                            echo ERREUR: Image python-api non trouvée
                            exit 1
                        )
                        docker inspect sandbox-ci-cd_r-api >nul 2>&1 || (
                            echo ERREUR: Image r-api non trouvée
                            exit 1
                        )
                        docker inspect sandbox-ci-cd_frontend >nul 2>&1 || (
                            echo ERREUR: Image frontend non trouvée
                            exit 1
                        )
                    '''
                    
                    // Tagging avec les bons noms de service
                    bat '''
                        echo Tagging des images...
                        docker tag sandbox-ci-cd_spring-app %REGISTRY%/spring-app:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_spring-app %REGISTRY%/spring-app:latest
                        docker tag sandbox-ci-cd_python-api %REGISTRY%/python-api:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_python-api %REGISTRY%/python-api:latest
                        docker tag sandbox-ci-cd_r-api %REGISTRY%/r-api:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_r-api %REGISTRY%/r-api:latest
                        docker tag sandbox-ci-cd_frontend %REGISTRY%/frontend:%IMAGE_TAG%
                        docker tag sandbox-ci-cd_frontend %REGISTRY%/frontend:latest
                    '''
                }
            }
        }
        
        stage('Security Scan') {
            when {
                expression { fileExists('C:\\trivy.exe') }
            }
            steps {
                script {
                    bat '''
                        trivy image --exit-code 0 --severity CRITICAL %REGISTRY%/spring-app:%IMAGE_TAG%
                        trivy image --exit-code 0 --severity CRITICAL %REGISTRY%/python-api:%IMAGE_TAG%
                        trivy image --exit-code 0 --severity CRITICAL %REGISTRY%/r-api:%IMAGE_TAG%
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
                    script {
                        timeout(time: 15, unit: 'MINUTES') {
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
            }
        }
        
        stage('Deploy') {
            steps {
                script {
                    try {
                        bat 'docker-compose down || exit 0'
                        bat 'docker-compose up -d --remove-orphans'
                    } catch (e) {
                        error "Échec du déploiement: ${e.message}"
                    }
                }
            }
        }
    }
    
    post {
        always {
            script {
                echo "Nettoyage des ressources Docker..."
                bat '''
                    for /f "tokens=*" %%i in ('docker ps -aq') do docker rm -f %%i || true
                    for /f "tokens=*" %%i in ('docker images -q -f "dangling=true"') do docker rmi %%i || true
                    docker system prune -f || true
                '''
                
                // Archive des logs
                archiveArtifacts artifacts: '**/target/*.jar,**/docker-compose.log', allowEmptyArchive: true
            }
        }
        
        failure {
            emailext body: '''
                Build ${BUILD_STATUS}<br>
                Job: ${JOB_NAME}<br>
                Numéro: ${BUILD_NUMBER}<br>
                Erreur: <a href="${BUILD_URL}console">Voir les logs</a><br>
                Durée: ${currentBuild.durationString}
            ''',
            subject: 'Échec du build Jenkins - ${JOB_NAME} #${BUILD_NUMBER}',
            to: 'huimlisamar@gmail.com',
            mimeType: 'text/html'
        }
        
        success {
            emailext body: '''
                Build ${BUILD_STATUS}<br>
                Job: ${JOB_NAME}<br>
                Numéro: ${BUILD_NUMBER}<br>
                Détails: <a href="${BUILD_URL}console">Voir les logs</a><br>
                Durée: ${currentBuild.durationString}
            ''',
            subject: 'Succès du build Jenkins - ${JOB_NAME} #${BUILD_NUMBER}',
            to: 'huimlisamar@gmail.com',
            mimeType: 'text/html'
        }
    }
}
