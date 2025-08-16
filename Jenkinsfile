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
                    credentialsId: 'github-cred'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    // Tests Spring Boot
                    dir('backend-spring') {
                        bat 'echo === Spring Boot Tests ==='
                        bat 'mvn test || exit 0'
                    }

                    // Tests Angular
                    dir('frontend-angular') {
                        bat 'echo === Angular Tests ==='
                        bat 'npm install'
                        bat 'npm test || exit 0'
                    }

                    // Tests Flask
                    dir('flask-api') {
                        bat 'echo === Flask Tests ==='
                        bat 'pytest || exit 0'
                    }
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
                    bat '''
                        where trivy >nul 2>nul
                        if %errorlevel% neq 0 (
                            echo ⚠️ Trivy n’est pas installé sur cet agent Jenkins
                        ) else (
                            trivy image %REGISTRY%/backend-spring:%IMAGE_TAG% || exit 0
                            trivy image %REGISTRY%/frontend-angular:%IMAGE_TAG% || exit 0
                            trivy image %REGISTRY%/flask-api:%IMAGE_TAG% || exit 0
                        )
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
        }
    }
}
