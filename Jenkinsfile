pipeline {
    agent any
    
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    url: 'https://github.com/samarhuimli/Pfe.git', 
                    credentialsId: 'github-cred'
            }
        }
        
        stage('Build') {
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
        
        stage('Deploy') {
            steps {
                dir('Sandbox-Spring') {
                    bat 'taskkill /IM java.exe /F || exit 0'
                    bat 'java -jar target/*.jar'
                }
            }
        }
    }
    
    post {
        always {
            echo "Pipeline terminé"
        }
        
        failure {
            bat 'echo Build échoué, vérifiez les logs.'
        }
    }
}
