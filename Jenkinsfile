pipeline {
    agent any

    environment {
        APP_URL = ''
        DOCKER_IMAGE = "maheshbharambe45/hotstar-app"
        ZAP_REPORT = 'zap_report.html'
        SONAR_HOST = 'http://3.111.96.69:9000'
        SONAR_TOKEN = credentials('SONAR_TOKEN')
    }

    stages {

        stage('check_files') {
            steps {
                sh 'ls -l'  
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('SonarQube Scan') {
            steps {
                sh """
                sonar-scanner \
                  -Dsonar.projectKey=hotstar-app \
                  -Dsonar.sources=src \
                  -Dsonar.exclusions=**/node_modules/**,**/build/** \
                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info \
                  -Dsonar.host.url=${SONAR_HOST} \
                  -Dsonar.login=${SONAR_TOKEN}
                """
            }
        }

        stage('Build Docker Image') {
            steps {
                sh "docker build -t ${DOCKER_IMAGE} ."
            }
        }

        stage('Docker Scout Scan') {
            steps {
                sh "docker scout cves ${DOCKER_IMAGE} || true"
            }
        }

        stage('Push Docker Image') {
            steps {
                withCredentials([usernamePassword(
                credentialsId: 'docker-credentials',
                usernameVariable: 'MY_DOCKER_USER',
                passwordVariable: 'MY_DOCKER_PASS'
            )]) {
                sh """
                echo "$MY_DOCKER_PASS" | docker login -u "$MY_DOCKER_USER" --password-stdin
                docker push ${DOCKER_IMAGE}:latest
                """
            }
            }
        }

        stage('Deploy to EKS') {
            steps {
                sh """
                    kubectl apply -f deployment.yml
                    kubectl apply -f service.yml
                    
                    sleep 60

                    # Get the app URL
                    APP_URL=\$(kubectl get svc hotstar-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                    echo "App URL: \$APP_URL"
                    echo \$APP_URL > app_url.txt
                """
                script {
                    env.APP_URL = readFile('app_url.txt').trim()
                }
            }
        }

        stage('OWASP ZAP Scan') {
            steps {
                sh """
                docker run --rm \
                  -v $WORKSPACE:/zap/wrk/:rw \
                  ghcr.io/zaproxy/zaproxy:stable \
                  zap-baseline.py \
                  -t ${APP_URL} \
                  -r ${ZAP_REPORT} \
                  --exitcode 0 --maxduration 5
                """
            }
        }

        stage('Publish ZAP Report') {
            steps {
                publishHTML(target: [
                    allowMissing: false,
                    alwaysLinkToLastBuild: true,
                    keepAll: true,
                    reportDir: '.',
                    reportFiles: "${ZAP_REPORT}",
                    reportName: 'OWASP ZAP Report'
                ])
            }
        }

    }

    post {
        always {
            archiveArtifacts artifacts: '**/zap_report.html', allowEmptyArchive: true
        }
    }
}
