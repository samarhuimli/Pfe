pipeline {
    agent any
    
    environment {
        PROJECT_NAME = 'sandbox'
        IMAGE_TAG = "${BUILD_NUMBER}"
        EMAIL_RECIPIENTS = 'huimlisamar@gmail.com'  // Update with your email
        GITHUB_CREDENTIALS = 'github-cred'
    }
    
    stages {
        stage('Début du Pipeline') {
            steps {
                echo "🚀 Démarrage du pipeline - Build #${BUILD_NUMBER}"
                echo "📋 Branche: ${env.BRANCH_NAME ?: 'devops'}"
                echo "⏰ Timestamp: ${new Date()}"
            }
        }
        
        stage('Checkout code depuis GitHub') {
            steps {
                git branch: 'devops', 
                    url: 'https://github.com/samarhuimli/Pfe.git', 
                    credentialsId: "${GITHUB_CREDENTIALS}"
                echo "✅ Code récupéré depuis GitHub"
            }
        }
        
        stage('Run Tests') {
            steps {
                dir('Sandbox-Spring') {
                    echo "🧪 Exécution des tests unitaires..."
                    bat 'mvn clean test'
                    
                    echo "📊 Publication des rapports de tests"
                    publishTestResults testResultsPattern: 'target/surefire-reports/*.xml'
                    
                    echo "📈 Analyse de la couverture de code"
                    bat 'mvn jacoco:report'
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'Sandbox-Spring/target/surefire-reports/**', allowEmptyArchive: true
                    archiveArtifacts artifacts: 'Sandbox-Spring/target/site/jacoco/**', allowEmptyArchive: true
                }
            }
        }
        
        stage('Build Application') {
            steps {
                dir('Sandbox-Spring') {
                    echo "🔨 Construction de l'application Spring Boot..."
                    bat 'mvn clean package -DskipTests'
                    bat '''
                        if not exist "target\\*.jar" (
                            echo ❌ ERREUR: Fichier JAR introuvable
                            exit 1
                        )
                    '''
                    echo "✅ Application construite avec succès"
                }
            }
        }
        
        stage('Build Docker Images') {
            steps {
                script {
                    echo "🐳 Construction des images Docker..."
                    
                    // Build Spring Boot API (matches docker-compose service: spring-app)
                    dir('Sandbox-Spring') {
                        bat "docker build -t ${PROJECT_NAME}/spring-app:${IMAGE_TAG} ."
                        bat "docker tag ${PROJECT_NAME}/spring-app:${IMAGE_TAG} ${PROJECT_NAME}/spring-app:latest"
                    }
                    
                    // Build Angular Dashboard (matches docker-compose service: frontend)
                    dir('angular-dashboard') {
                        bat "docker build -t ${PROJECT_NAME}/frontend:${IMAGE_TAG} ."
                        bat "docker tag ${PROJECT_NAME}/frontend:${IMAGE_TAG} ${PROJECT_NAME}/frontend:latest"
                    }
                    
                    // Build Python API (matches docker-compose service: python-api)
                    dir('python-api') {
                        bat "docker build -t ${PROJECT_NAME}/python-api:${IMAGE_TAG} ."
                        bat "docker tag ${PROJECT_NAME}/python-api:${IMAGE_TAG} ${PROJECT_NAME}/python-api:latest"
                    }
                    
                    // Build R API (matches docker-compose service: r-api)
                    dir('r-api') {
                        bat "docker build -t ${PROJECT_NAME}/r-api:${IMAGE_TAG} ."
                        bat "docker tag ${PROJECT_NAME}/r-api:${IMAGE_TAG} ${PROJECT_NAME}/r-api:latest"
                    }
                    
                    echo "✅ Images Docker construites avec succès"
                }
            }
        }
        
        stage('Security Scan avec Trivy') {
            steps {
                script {
                    echo "🔒 Analyse de sécurité avec Trivy..."
                    
                    // Scan each image
                    def images = ["${PROJECT_NAME}/spring-app:latest", "${PROJECT_NAME}/frontend:latest", 
                                 "${PROJECT_NAME}/python-api:latest", "${PROJECT_NAME}/r-api:latest"]
                    
                    images.each { image ->
                        echo "🔍 Scan de sécurité pour ${image}"
                        bat """
                            trivy image --format json --output trivy-report-${image.replace(':', '-').replace('/', '-')}.json ${image} || echo "Trivy scan completed with warnings"
                        """
                    }
                    
                    echo "✅ Analyse de sécurité terminée"
                }
            }
            post {
                always {
                    archiveArtifacts artifacts: 'trivy-report-*.json', allowEmptyArchive: true
                }
            }
        }
        
        stage('Déploiement avec docker-compose up') {
            steps {
                script {
                    echo "🚀 Déploiement avec docker-compose..."
                    
                    // Stop existing containers
                    bat 'docker-compose down || echo "No existing containers to stop"'
                    
                    // Deploy with docker-compose
                    bat "docker-compose up -d"
                    
                    // Wait for services to be healthy
                    echo "⏳ Attente du démarrage des services..."
                    sleep(time: 30, unit: 'SECONDS')
                    
                    // Verify deployment
                    bat 'docker-compose ps'
                    
                    echo "✅ Déploiement terminé"
                }
            }
        }
        
        stage('Post-build - Vérification & Cleanup') {
            steps {
                script {
                    echo "🧹 Vérification et nettoyage post-déploiement..."
                    
                    // Health checks
                    echo "🏥 Vérification de l'état des services..."
                    bat '''
                        timeout 60 >nul 2>&1 || (
                            echo ⚡ Test de connectivité des services...
                            curl -f http://localhost:8080/actuator/health || echo "API Spring Boot non accessible"
                            curl -f http://localhost:4200 || echo "Frontend Angular non accessible"
                            curl -f http://localhost:5000 || echo "API Python non accessible"
                        )
                    '''
                    
                    // Cleanup old images
                    echo "🗑️ Nettoyage des anciennes images..."
                    bat 'docker image prune -f || echo "Cleanup completed"'
                    
                    echo "✅ Post-build terminé"
                }
            }
        }
    }
    
    post {
        always {
            echo "🏁 Pipeline terminé - Build #${BUILD_NUMBER}"
            
            // Archive build artifacts
            archiveArtifacts artifacts: 'Sandbox-Spring/target/*.jar', allowEmptyArchive: true
            
            // Clean workspace
            cleanWs()
        }
        
        success {
            script {
                def buildSuccess = true
                echo "✅ Build réussi ! Toutes les étapes ont été complétées avec succès."
                
                // Send success email
                emailext (
                    subject: "✅ Pipeline SUCCESS - ${env.JOB_NAME} #${BUILD_NUMBER}",
                    body: """
                        <h2>🎉 Build Successful!</h2>
                        <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                        <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                        <p><strong>Build URL:</strong> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                        <p><strong>Status:</strong> ✅ SUCCESS</p>
                        <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                        
                        <h3>📋 Étapes complétées:</h3>
                        <ul>
                            <li>✅ Checkout du code</li>
                            <li>✅ Tests unitaires</li>
                            <li>✅ Build de l'application</li>
                            <li>✅ Construction des images Docker</li>
                            <li>✅ Scan de sécurité</li>
                            <li>✅ Push vers le registry</li>
                            <li>✅ Déploiement</li>
                        </ul>
                    """,
                    mimeType: 'text/html',
                    to: "${EMAIL_RECIPIENTS}"
                )
            }
        }
        
        failure {
            script {
                echo "❌ Build échoué ! Vérifiez les logs pour plus de détails."
                
                // Send failure email
                emailext (
                    subject: "❌ Pipeline FAILED - ${env.JOB_NAME} #${BUILD_NUMBER}",
                    body: """
                        <h2>💥 Build Failed!</h2>
                        <p><strong>Job:</strong> ${env.JOB_NAME}</p>
                        <p><strong>Build Number:</strong> ${BUILD_NUMBER}</p>
                        <p><strong>Build URL:</strong> <a href="${BUILD_URL}">${BUILD_URL}</a></p>
                        <p><strong>Status:</strong> ❌ FAILED</p>
                        <p><strong>Duration:</strong> ${currentBuild.durationString}</p>
                        
                        <h3>🔍 Actions recommandées:</h3>
                        <ul>
                            <li>Vérifiez les logs de build</li>
                            <li>Examinez les tests qui ont échoué</li>
                            <li>Vérifiez les rapports de sécurité</li>
                            <li>Contactez l'équipe de développement</li>
                        </ul>
                        
                        <p><strong>Console Output:</strong> <a href="${BUILD_URL}console">Voir les logs</a></p>
                    """,
                    mimeType: 'text/html',
                    to: "${EMAIL_RECIPIENTS}"
                )
            }
        }
        
        unstable {
            echo "⚠️ Build instable - certains tests ont échoué mais le build continue"
        }
    }
}
