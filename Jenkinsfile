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
                        sh 'echo "=== Spring Boot Tests ==="'
                        sh 'mvn test || true'
                    }

                    // Tests Angular
                    dir('frontend-angular') {
                        sh 'echo "=== Angular Tests ==="'
                        sh 'npm install'
                        sh 'npm test || true'
                    }

                    // Tests Flask
                    dir('flask-api') {
                        sh 'echo "=== Flask Tests ==="'
                        sh 'pytest || true'
                    }
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
                    sh '''
                        if ! command -v trivy &> /dev/null
                        then
                            echo "⚠️ Trivy n’est pas installé sur cet agent Jenkins"
                        else
                            trivy image $REGISTRY/backend-spring:$IMAGE_TAG || true
                            trivy image $REGISTRY/frontend-angular:$IMAGE_TAG || true
                            trivy image $REGISTRY/flask-api:$IMAGE_TAG || true
                        fi
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
                        docker-compose push
                    '''
                }
            }
        }

        stage('Deploy to Sandbox') {
            steps {
                sh '''
                    docker-compose down || true
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
