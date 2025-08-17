pipeline {
    agent any

    environment {
        DOCKER_COMPOSE_FILE = 'docker-compose.yml'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/samarhumili/Pfe.git',
                    credentialsId: 'github-cred'
            }
        }

        stage('Build Docker Images') {
            steps {
                sh "docker-compose -f $DOCKER_COMPOSE_FILE build"
            }
        }

        stage('Run Docker Containers') {
            steps {
                sh "docker-compose -f $DOCKER_COMPOSE_FILE up -d"
            }
        }

        stage('Verify Services') {
            steps {
                sh "docker ps" // juste pour voir si tes conteneurs tournent
            }
        }
    }
}
