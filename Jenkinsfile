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
        
        stage('Build') {
            parallel {
                stage('Backend') {
                    steps {
                        dir('Sandbox-Spring') {
                            bat 'mvn clean package -DskipTests'
                        }
                    }
                }
                stage('Frontend') {
                    steps {
                        dir('angular-dashboard') {
                            bat 'npm install && npm run build -- --configuration production'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    bat 'docker-compose build --no-cache'
                    bat 'docker images'
                    bat '''
                        for %%i in (spring-app python-api r-api frontend) do (
                            docker inspect sandbox-ci-cd-%%i >nul 2>&1
                            if !ERRORLEVEL! == 0 (
                                docker tag sandbox-ci-cd-%%i "%REGISTRY%/%%i:%IMAGE_TAG%"
                                docker tag sandbox-ci-cd-%%i "%REGISTRY%/%%i:latest"
                            ) else (
                                echo ERREUR: Image %%i non trouvée
                                exit 1
                            )
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
                        for %%i in (spring-app python-api r-api frontend) do (
                            docker push %REGISTRY%/%%i:%IMAGE_TAG%
                            docker push %REGISTRY%/%%i:latest
                        )
                    '''
                }
            }
        }
        
        stage('Deploy') {
            steps {
                bat 'docker-compose down || exit 0 && docker-compose up -d'
            }
        }
    }
    
    post {
        always {
            echo "Pipeline terminé"
            bat 'docker ps -a'
            script {
                try {
                    def exitedContainers = bat(script: 'docker ps -aq -f "status=exited"', returnStdout: true).trim()
                    if (exitedContainers) {
                        bat "docker rm -f ${exitedContainers.replace('\r\n', ' ')}"
                    }
                } catch (e) {
                    echo "Cleanup failed: ${e.message}"
                }
            }
        }
        
        failure {
            echo 'Build échoué, vérifiez les logs.'
            // Désactiver email temporairement si problème SMTP
            // emailext body: 'Le build ${BUILD_STATUS}\nVoir: ${BUILD_URL}',
            //         subject: 'Échec du build',
            //         to: 'huimlisamar@gmail.com'
        }
    }
}
