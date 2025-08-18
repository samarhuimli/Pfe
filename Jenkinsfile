pipeline {
    agent any
    
    environment {
        // Configuration Docker
        REGISTRY = "samarhuimli"
        IMAGE_TAG = "${env.BUILD_NUMBER}"
        DOCKER_BUILDKIT = "1"
        COMPOSE_DOCKER_CLI_BUILD = "1"
        COMPOSE_PARALLEL_LIMIT = "4"
        
        // Configuration base de données
        POSTGRES_DB = "sandbox"
        POSTGRES_USER = "postgres"
        POSTGRES_PASSWORD = "samar"
        SPRING_DATASOURCE_URL = "jdbc:postgresql://postgres:5432/sandbox"
        SPRING_DATASOURCE_USERNAME = "postgres"
        SPRING_DATASOURCE_PASSWORD = "samar"
    }
    
    options {
        timeout(time: 2, unit: 'HOURS')
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }
    
    stages {
        stage('Vérification Structure Projet') {
            steps {
                script {
                    def requiredDirs = [
                        'Sandbox-Spring',
                        'angular-dashboard',
                        'python-api',
                        'r-api'
                    ]
                    
                    requiredDirs.each { dir ->
                        if (!fileExists(dir)) {
                            error "Répertoire manquant: ${dir}"
                        }
                    }
                    
                    bat '''
                        echo Structure du projet:
                        tree /F
                    '''
                }
            }
        }
        
        stage('Build Backend') {
            options {
                timeout(time: 20, unit: 'MINUTES')
            }
            steps {
                dir('Sandbox-Spring') {
                    bat '''
                        mvn clean package -DskipTests -B -q
                        if not exist "target\\*.jar" (
                            echo ERREUR: Fichier JAR introuvable
                            dir /s /b target
                            exit 1
                        )
                    '''
                }
            }
        }
        
        stage('Build Frontend') {
            options {
                timeout(time: 15, unit: 'MINUTES')
            }
            steps {
                dir('angular-dashboard') {
                    bat '''
                        npm ci --no-audit --prefer-offline
                        npm run build -- --configuration production
                        if not exist "dist\\*" (
                            echo ERREUR: Build frontend échoué
                            exit 1
                        )
                    '''
                }
            }
        }
        
        stage('Build Docker Images') {
            options {
                timeout(time: 45, unit: 'MINUTES')
            }
            steps {
                script {
                    try {
                        // Construction en parallèle
                        def parallelBuilds = [:]
                        parallelBuilds['spring'] = {
                            bat 'docker-compose build spring-app'
                        }
                        parallelBuilds['frontend'] = {
                            bat 'docker-compose build frontend'
                        }
                        parallel(parallelBuilds)
                        
                        // Construction séquentielle
                        bat 'docker-compose build python-api'
                        bat 'docker-compose build r-api'
                        
                        // Vérification des images
                        bat '''
                            echo Liste des images construites:
                            docker images --format "table {{.Repository}}\\t{{.Tag}}"
                            
                            if not exist "$(docker images -q sandbox-ci-cd_spring-app)" (
                                echo ERREUR: Image spring-app manquante
                                exit 1
                            )
                            if not exist "$(docker images -q sandbox-ci-cd_frontend)" (
                                echo ERREUR: Image frontend manquante
                                exit 1
                            )
                        '''
                    } catch (e) {
                        error "Échec construction Docker: ${e.message}"
                    }
                }
            }
        }
        
        stage('Tag Images') {
            steps {
                script {
                    def images = [
                        'spring-app': 'sandbox-ci-cd_spring-app',
                        'frontend': 'sandbox-ci-cd_frontend',
                        'python-api': 'sandbox-ci-cd_python-api',
                        'r-api': 'sandbox-ci-cd_r-api'
                    ]
                    
                    images.each { name, source ->
                        bat """
                            docker tag ${source} ${REGISTRY}/${name}:${IMAGE_TAG}
                            docker tag ${source} ${REGISTRY}/${name}:latest
                            echo Tagged ${source} as ${REGISTRY}/${name}:${IMAGE_TAG}
                        """
                    }
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
                        trivy image --exit-code 0 --severity CRITICAL \
                            ${REGISTRY}/spring-app:${IMAGE_TAG} || echo "Scan spring-app terminé"
                        trivy image --exit-code 0 --severity CRITICAL \
                            ${REGISTRY}/frontend:${IMAGE_TAG} || echo "Scan frontend terminé"
                    '''
                }
            }
        }
        
        stage('Push Images') {
            options {
                timeout(time: 30, unit: 'MINUTES')
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker-cred',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    script {
                        bat '''
                            echo %DOCKER_PASS% | docker login -u %DOCKER_USER% --password-stdin
                            docker push %REGISTRY%/spring-app:%IMAGE_TAG%
                            docker push %REGISTRY%/frontend:%IMAGE_TAG%
                            docker push %REGISTRY%/python-api:%IMAGE_TAG%
                            docker push %REGISTRY%/r-api:%IMAGE_TAG%
                        '''
                    }
                }
            }
        }
        
        stage('Déploiement') {
            steps {
                script {
                    try {
                        bat '''
                            docker-compose down --remove-orphans --volumes
                            docker-compose up -d --no-build
                            timeout /t 60 /nobreak >nul
                            docker-compose ps
                        '''
                    } catch (e) {
                        error "Échec déploiement: ${e.message}"
                    }
                }
            }
        }
        
        stage('Vérification') {
            steps {
                script {
                    bat '''
                        echo Statut des conteneurs:
                        docker-compose ps
                        
                        echo Logs Spring Boot:
                        docker-compose logs --tail=50 spring-app
                    '''
                }
            }
        }
    }
    
    post {
        always {
            script {
                // Archivage des artefacts
                archiveArtifacts artifacts: '**/target/*.jar,**/dist/**/*', allowEmptyArchive: true
                junit '**/target/surefire-reports/*.xml'
                
                // Nettoyage
                bat '''
                    docker-compose down --remove-orphans --volumes || true
                    docker system prune -f --volumes || true
                '''
            }
        }
        
        success {
            emailext(
                subject: "SUCCÈS: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: """
                Pipeline exécuté avec succès!
                
                Détails:
                - Durée: ${currentBuild.durationString}
                - Images construites: ${REGISTRY}/*:${IMAGE_TAG}
                - Consulter: ${env.BUILD_URL}
                """,
                to: 'huimlisamar@gmail.com'
            )
        }
        
        failure {
            script {
                // Capture des logs en cas d'échec
                bat '''
                    docker-compose logs --no-color > docker-compose.log
                    docker system df > docker-system.log
                '''
                archiveArtifacts artifacts: 'docker-compose.log,docker-system.log', allowEmptyArchive: true
                
                emailext(
                    subject: "ÉCHEC: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                    body: """
                    Le pipeline a échoué!
                    
                    Détails:
                    - Cause: ${currentBuild.currentResult}
                    - Étape: ${env.STAGE_NAME}
                    - Consulter: ${env.BUILD_URL}
                    - Logs: ${env.BUILD_URL}console
                    """,
                    to: 'huimlisamar@gmail.com'
                )
            }
        }
        
        unstable {
            emailext(
                subject: "INSTABLE: ${env.JOB_NAME} #${env.BUILD_NUMBER}",
                body: "Le pipeline est instable.\nConsulter: ${env.BUILD_URL}",
                to: 'huimlisamar@gmail.com'
            )
        }
    }
}
