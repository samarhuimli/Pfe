pipeline {
    agent any

    environment {
        // Configuration base de données
        POSTGRES_DB = "sandbox"
        POSTGRES_USER = "postgres"
        POSTGRES_PASSWORD = "samar"
        SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/sandbox"
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
                    bat 'mvn clean package'
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
                    bat '''
                        if not exist "dist\\*" (
                            echo ERREUR: Build frontend échoué
                            exit 1
                        )
                    '''
                }
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    dir('Sandbox-Spring') {
                        bat 'mvn test'
                    }
                    dir('angular-dashboard') {
                        bat 'npm test'
                    }
                }
            }
        }
    }

    post {
        always {
            junit '**/target/surefire-reports/*.xml'
            archiveArtifacts artifacts: '**/target/*.jar,**/dist/**/*', allowEmptyArchive: true
        }

        success {
            emailext(
                subject: "SUCCÈS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                Pipeline exécuté avec succès!
                
                Détails:
                - Durée: ${currentBuild.durationString}
                - Consulter: ${env.BUILD_URL}
                """,
                to: 'huimlisamar@gmail.com'
            )
        }

        failure {
            emailext(
                subject: "ÉCHEC: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                Le pipeline a échoué!
                
                Détails:
                - Cause: ${currentBuild.currentResult}
                - Consulter: ${env.BUILD_URL}console
                """,
                to: 'huimlisamar@gmail.com'
            )
        }
    }
}
