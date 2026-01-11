    pipeline {
        agent any

        environment {
            REMOTE_IP = credentials('DEPLOY_SERVER') // REMOTE SERVER
            DOCKER_IMAGE = "maheshbharambe45/hotstar-app"
            ZAP_REPORT = 'zap_report.html'
            SONAR_HOST = 'http://3.111.96.69:9000'
            SONAR_TOKEN = credentials('SONAR_TOKEN')
            NODE_OPTIONS = "--experimental-vm-modules"
        }

        stages {

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

            stage('Docker Login') {
                steps {
                    withCredentials([usernamePassword(
                        credentialsId: 'docker-credentials',
                        usernameVariable: 'MY_DOCKER_USER',
                        passwordVariable: 'MY_DOCKER_PASS'
                    )]) {
                        sh '''
                            echo "$MY_DOCKER_PASS" | docker login -u "$MY_DOCKER_USER" --password-stdin
                        '''
                    }
                }
            }


            stage('Build Docker Image') {
                steps {
                    sh "docker build -t ${DOCKER_IMAGE} ./n"
                }
            }

            stage('Docker Scout Scan') {
                steps {
                     sh '''
                    # Create cache directory and set environment variable for Docker Scout

                    mkdir -p $WORKSPACE/.docker-scout-cache
                    export DOCKER_SCOUT_CACHE_DIR=$WORKSPACE/.docker-scout-cache

                    curl -sSfL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | sh -s -- -b $WORKSPACE/.docker-plugins

                    $WORKSPACE/.docker-plugins/docker-scout cves ${DOCKER_IMAGE}:latest
                '''
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

            stage('Copy Manifests') {
                steps {
                    withCredentials([sshUserPrivateKey(credentialsId: 'SSH', keyFileVariable: 'SSH_KEY')]) {
                        sh '''
                        scp -i "$SSH_KEY" -o StrictHostKeyChecking=no deployment.yml service.yml ubuntu@$REMOTE_IP:/home/ubuntu/
                         '''
                    }
                }
            }

            stage('Deploy Application') {
                steps {
                    withCredentials([sshUserPrivateKey(credentialsId: 'SSH', keyFileVariable: 'SSH_KEY')]) {
                        sh """
                        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no ubuntu@$REMOTE_IP "
                        aws eks update-kubeconfig --name hotstar-eks --region ap-south-1 --alias hotstar-eks &&
                        kubectl apply -f deployment.yml &&
                        kubectl apply -f service.yml
                        "
                        """
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
                                sleep 120 &&
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
                    script {
                    def target = env.APP_URL ?: readFile('app_url.txt').trim()
                    if (!target) {
                        error "No APP_URL — cannot run ZAP scan"
                    }
                    sh """
                        mkdir -p ${WORKSPACE}/zap-output
                        chmod 777 ${WORKSPACE}/zap-output

                        docker run --rm \
                        -v ${WORKSPACE}/zap-output:/zap/wrk:rw \
                        ghcr.io/zaproxy/zaproxy:stable \
                        zap-baseline.py \
                            -t http://${target} \
                            -r ${ZAP_REPORT} \
                            -I \
                            -m 5
                    """
                    }
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
    }