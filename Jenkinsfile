    pipeline {
        agent any

        environment {
            APP_URL = ''
            DOCKER_IMAGE = "maheshbharambe45/hotstar-app"
            ZAP_REPORT = 'zap_report.html'
            SONAR_HOST = 'http://3.111.96.69:9000'
            SONAR_TOKEN = credentials('SONAR_TOKEN')
            NODE_OPTIONS = "--experimental-vm-modules"
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
                sh '''
                docker run --rm \
                    -e SONAR_HOST_URL=$SONAR_HOST \
                    -e SONAR_LOGIN=$SONAR_TOKEN \
                    -v $(pwd):/usr/src \
                    sonarsource/sonar-scanner-cli \
                    -Dsonar.projectKey=hotstar-app \
                    -Dsonar.projectName=hotstar-app \
                    -Dsonar.sources=src \
                    -Dsonar.exclusions=**/node_modules/**,**/build/** \
                    -Dsonar.login=$SONAR_TOKEN
                '''
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
                script {
                sh """
                    aws eks update-kubeconfig --name hotstar-eks --region ap-south-1 --alias hotstar-eks
                    kubectl apply -f deployment.yml
                    kubectl apply -f service.yml
                    sleep 120
                    APP_URL=\$(kubectl get svc hotstar-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
                    echo \$APP_URL > app_url.txt
                    ls -la
                    cat app_url.txt
                """
                    sh 'cat app_url.txt'
                    def url = readFile('app_url.txt').trim()
                    if (!url) {
                        error "Service hostname not found. Aborting."
                    }
                    env.APP_URL = url
                    echo "Deployed App URL: ${env.APP_URL}"

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
                    -t https://$APP_URL \
                    -r ${ZAP_REPORT} \
                    -I \
                    --maxduration 5
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
