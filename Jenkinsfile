    pipeline {
        agent any

        environment {
            REMOTE_IP = credentials('DEPLOY_SERVER')
            DOCKER_IMAGE = "maheshbharambe45/hotstar-app"
            DOCKER_TAG   = "1.0"
            ZAP_REPORT = 'zap_report.html'
            SONAR_HOST = 'http://3.111.96.69:9000'
            SONAR_TOKEN = credentials('SONAR_TOKEN')
            NODE_OPTIONS = "--experimental-vm-modules"
        }

        options {
            disableConcurrentBuilds()
            timestamps()
            timeout(time: 60, unit: 'MINUTES')
        }

        stages {

            stage('Checkout') {
                        steps {
                            git branch: 'main',
                                url: 'https://github.com/Maheshbharambe45/Hotstar-Project-DevSecOps-Pipeline.git'
                            sh 'ls -l'
                }
            }

            stage('Install Dependencies') {
                steps {
                    sh 'npm install'
                }
            }

            stage('Build Application') {
                steps {
                    sh 'npm run build'
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

            stage('Sonar Quality Gate') {
                steps {
                    timeout(time: 5, unit: 'MINUTES') {
                        waitForQualityGate abortPipeline: true
                    }
                }
            }

            stage('Docker Login') {
                steps {
                    withCredentials([usernamePassword(credentialsId: 'docker-credentials', usernameVariable: 'MY_DOCKER_USER', passwordVariable: 'MY_DOCKER_PASS')]) {
                        sh 'echo "$MY_DOCKER_PASS" | docker login -u "$MY_DOCKER_USER" --password-stdin'
                    }
                }
            }

            stage('Build Docker Image') {
                steps {
                    sh "docker build -t ${DOCKER_IMAGE}:${DOCKER_TAG} ."
                }
            }

            stage('Docker Scout Scan') {
                steps {
                    sh '''
                    # Create cache directory and set environment variable for Docker Scout
                    mkdir -p $WORKSPACE/.docker-scout-cache
                    export DOCKER_SCOUT_CACHE_DIR=$WORKSPACE/.docker-scout-cache

                    curl -sSfL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh -s -- -b $WORKSPACE/.docker-plugins

                    $WORKSPACE/.docker-plugins/docker-scout cves ${DOCKER_IMAGE}:${DOCKER_TAG} > scout-report.txt
                    '''
                }
            }

            stage('Security Gate - Docker Scout') {
                steps {
                    sh '''
                    if grep -q "CRITICAL[[:space:]]*[1-9]" scout-report.txt; then
                        echo " CRITICAL vulnerabilities found. Failing pipeline."
                        exit 1
                    else
                        echo " No CRITICAL vulnerabilities found. Pipeline can continue."
                    fi
                    '''
                }
            }


            stage('Push Docker Image') {
                steps {
                    sh "docker push ${DOCKER_IMAGE}:${DOCKER_TAG}"
                }
            }

            stage('Copy Kubernetes Manifests') {
                steps {
                    withCredentials([sshUserPrivateKey(credentialsId: 'SSH', keyFileVariable: 'SSH_KEY')]) {
                        sh 'scp -i "$SSH_KEY" -o StrictHostKeyChecking=no deployment.yml service.yml ubuntu@$REMOTE_IP:/home/ubuntu/'
                    }
                }
            }

            stage('Deploy to EKS') {
                steps {
                    withCredentials([sshUserPrivateKey(credentialsId: 'SSH', keyFileVariable: 'SSH_KEY')]) {
                        sh '''
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "
                        aws eks update-kubeconfig --name hotstar-eks --region ap-south-1 &&
                        kubectl apply -f deployment.yml &&
                        kubectl apply -f service.yml
                        "
                        '''
                    }
                }
            }

            stage('Verify Kubernetes Deployment') {
                steps {
                    withCredentials([sshUserPrivateKey(credentialsId: 'SSH', keyFileVariable: 'SSH_KEY')]) {
                        sh '''
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "
                        kubectl get pods -o wide
                        kubectl get svc
                        kubectl get deploy
                        kubectl rollout status deployment/hotstar-app
                        POD=\$(kubectl get pods -l app=hotstar -o jsonpath='{.items[0].metadata.name}')
                        kubectl logs \$POD --tail=50
                        "
                        '''
                    }
                }
            }

            stage('Fetch App URL') {
                steps {
                    script {
                        withCredentials([sshUserPrivateKey(credentialsId: 'SSH', keyFileVariable: 'SSH_KEY')]) {
                            env.APP_URL = sh(
                                script: """
                                    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP \
                                    kubectl get svc hotstar-service -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
                                """,
                                returnStdout: true
                            ).trim()
                        }
                    }
                }
            }

            stage('OWASP ZAP Scan') {
                steps {
                    sh '''
                    mkdir -p zap-output
                    docker run --rm \
                    -v $(pwd)/zap-output:/zap/wrk \
                    ghcr.io/zaproxy/zaproxy:stable \
                    zap-baseline.py -t http://${APP_URL} -r ${ZAP_REPORT}
                    '''
                }
            }

            stage('Publish ZAP Report') {
                steps {
                    publishHTML(target: [
                        reportDir: 'zap-output',
                        reportFiles: "${ZAP_REPORT}",
                        reportName: 'OWASP ZAP Report'
                    ])
                    archiveArtifacts artifacts: "zap-output/${ZAP_REPORT}"
                }
            }
        }

        post {
            success {
                echo "Pipeline completed successfully"
            }
            failure {
                echo "Pipeline failed"
            }
            always {
                echo "Pipeline execution finished"
            }
        }
    }
