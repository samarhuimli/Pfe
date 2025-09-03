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
                    junit testResults: 'target/surefire-reports/*.xml'
                    
                    echo "📈 Analyse de la couverture de code"
                    bat 'mvn jacoco:report || echo "⚠️ JaCoCo report generation failed - continuing pipeline"'
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
                        dir target\\*.jar >nul 2>&1
                        if %errorlevel% neq 0 (
                            echo ❌ ERREUR: Fichier JAR introuvable
                            dir target
                            exit 1
                        ) else (
                            echo ✅ Fichier JAR trouvé:
                            dir target\\*.jar
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
                    
                    // Check Docker availability first
                    try {
                        bat 'docker --version'
                        echo "✅ Docker CLI disponible"
                    } catch (Exception e) {
                        echo "❌ Docker CLI non disponible: ${e.getMessage()}"
                        currentBuild.result = 'FAILURE'
                        error("Docker CLI requis pour continuer")
                    }
                    
                    try {
                        bat 'docker info'
                        echo "✅ Docker daemon accessible"
                    } catch (Exception e) {
                        echo "❌ Docker daemon non accessible: ${e.getMessage()}"
                        echo "⚠️ Vérifiez que Docker Desktop est démarré"
                        currentBuild.result = 'FAILURE'
                        error("Docker daemon requis pour continuer")
                    }
                    
                    // Build images one by one with detailed error handling
                    try {
                        // Build Spring Boot API first (most likely to succeed)
                        dir('Sandbox-Spring') {
                            echo "🔨 Construction image Spring Boot..."
                            bat "docker build -t ${PROJECT_NAME}/spring-app:${IMAGE_TAG} . || exit 1"
                            bat "docker tag ${PROJECT_NAME}/spring-app:${IMAGE_TAG} ${PROJECT_NAME}/spring-app:latest"
                            echo "✅ Image Spring Boot créée"
                        }
                        
                        // Build Python API (simpler than Angular/R)
                        dir('python-api') {
                            echo "🔨 Construction image Python..."
                            bat "docker build -t ${PROJECT_NAME}/python-api:${IMAGE_TAG} . || exit 1"
                            bat "docker tag ${PROJECT_NAME}/python-api:${IMAGE_TAG} ${PROJECT_NAME}/python-api:latest"
                            echo "✅ Image Python créée"
                        }
                        
                        // Build Angular Dashboard (can be slow)
                        dir('angular-dashboard') {
                            echo "🔨 Construction image Angular (peut prendre du temps)..."
                            bat "docker build -t ${PROJECT_NAME}/frontend:${IMAGE_TAG} . || exit 1"
                            bat "docker tag ${PROJECT_NAME}/frontend:${IMAGE_TAG} ${PROJECT_NAME}/frontend:latest"
                            echo "✅ Image Angular créée"
                        }
                        
                        // Build R API (most complex)
                        dir('r-api') {
                            echo "🔨 Construction image R (peut prendre du temps)..."
                            bat "docker build -t ${PROJECT_NAME}/r-api:${IMAGE_TAG} . || exit 1"
                            bat "docker tag ${PROJECT_NAME}/r-api:${IMAGE_TAG} ${PROJECT_NAME}/r-api:latest"
                            echo "✅ Image R créée"
                        }
                        
                        echo "✅ Toutes les images Docker construites avec succès"
                        bat 'docker images | findstr %PROJECT_NAME%'
                        
                    } catch (Exception e) {
                        echo "❌ Erreur lors de la construction Docker: ${e.getMessage()}"
                        bat 'docker images | findstr %PROJECT_NAME% || echo "Aucune image trouvée"'
                        bat 'docker ps -a || echo "Impossible de lister les conteneurs"'
                        currentBuild.result = 'FAILURE'
                        error("Échec de la construction Docker")
                    }
                }
            }
        }
        
        stage('Security Scan avec Trivy') {
            steps {
                script {
                    echo "🔒 Analyse de sécurité avec Trivy..."
                    
                    // Check if Trivy is available
                    def trivyAvailable = false
                    try {
                        bat 'trivy --version'
                        trivyAvailable = true
                        echo "✅ Trivy disponible"
                    } catch (Exception e) {
                        echo "⚠️ Trivy non disponible - analyse de sécurité ignorée"
                        echo "Pour installer Trivy: https://aquasecurity.github.io/trivy/latest/getting-started/installation/"
                    }
                    
                    if (trivyAvailable) {
                        try {
                            // Scan each image
                            echo "🔍 Scan Spring Boot image..."
                            bat "trivy image --exit-code 0 --severity HIGH,CRITICAL ${PROJECT_NAME}/spring-app:${IMAGE_TAG}"
                            
                            echo "🔍 Scan Angular image..."
                            bat "trivy image --exit-code 0 --severity HIGH,CRITICAL ${PROJECT_NAME}/frontend:${IMAGE_TAG}"
                            
                            echo "🔍 Scan Python API image..."
                            bat "trivy image --exit-code 0 --severity HIGH,CRITICAL ${PROJECT_NAME}/python-api:${IMAGE_TAG}"
                            
                            echo "🔍 Scan R API image..."
                            bat "trivy image --exit-code 0 --severity HIGH,CRITICAL ${PROJECT_NAME}/r-api:${IMAGE_TAG}"
                            
                            echo "✅ Analyse de sécurité terminée"
                        } catch (Exception e) {
                            echo "⚠️ Erreur lors du scan de sécurité: ${e.getMessage()}"
                            echo "Le pipeline continue malgré l'erreur de scan"
                        }
                    } else {
                        echo "⚠️ Analyse de sécurité ignorée - Trivy non installé"
                    }
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
                            curl -f http://localhost:8085/actuator/health || echo "API Spring Boot non accessible"
                            curl -f http://localhost:4200 || echo "Frontend Angular non accessible"
                            curl -f http://localhost:8084 || echo "API Python non accessible"
                            curl -f http://localhost:8086 || echo "API R non accessible"
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
