## 🚀 Implementing a Secure CI/CD Pipeline for Hotstar Clone Using DevSecOps Principles

#### This project implements a secure CI/CD pipeline for a **Hotstar-like streaming application** deployed on **AWS EKS** using **DevSecOps** best practices. It integrates security checks directly into the pipeline to catch vulnerabilities early and enforce secure deployments.


#### Key security integrations:
- **SonarQube** → Static code analysis 
- **OWASP ZAP** → Dynamic application security testing 
- **Docker Scout** → Container image vulnerability scanning
- **Terraform** → Infrastructure as Code (AWS EKS provisioning)
- **Jenkins** → Orchestrates CI/CD pipeline

### After creation of Terraform Infrastructure Pipeline we will execute these JOB
ss of clus

### Prerequisites on server

### 1. Tools on Jenkins Node

Make sure these are installed and available in on the Jenkins agent:

- **Git**
- **Node.js** and **npm**
- **Docker Engine**
- **AWS CLI**
- **kubectl**

### 2. Jenkins Plugins

Install and configure:

- **Pipeline**
- **Git**
- **HTML Publisher**

### 3. External Services

- **SonarQube Server**

  - sonarqube run using the docker container 

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:latest
```
  - Accessible from Jenkins (e.g. `http://3.111.96.69:8080`).
  - A **project key** configured: `hotstar-app`.
  - A **Sonar token** with analysis permissions.

![Website Screenshot](assets/Screenshot%202025-12-08%20191838.png)

- **Docker Hub**
  - Account : maheshbharambe45  After image will push on these account.

- **AWS EKS Cluster**
  - Cluster name: `hotstar-eks`.
  - Region: `ap-south-1`.
  - Worker nodes able to pull Docker Hub images.
  - Security groups and IAM roles properly configured.


### 4. Jenkins Credentials

Create these credentials in **Manage Jenkins → Credentials**:

1. `SONAR_TOKEN`  
   - Type: Secret text .  
   - Value: SONAR_TOKEN.

2. `MY_DOCKER_PASS`  
   - Type: Secret text or Username/Password.  
   - Username: `maheshbharambe45`  
   - Password: Docker Hub token.

3. AWS credentials  
   - `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` as environment or Jenkins credentials.

![Website Screenshot](assets/Screenshot%202025-12-08%20183110.png)


## Jenkins Pipeline – Stage by Stage

### 1️⃣ Checkout SCM

Checks out the repo from GitHub:
```bash
https://github.com/Maheshbharambe45/Hotstar-Project-DevSecOps-Pipeline.git
```

### 2️⃣ Check Files

Verifies the expected project structure

### 3️⃣ Install Dependencies

Installs Node.js dependencies
```bash
npm install
```

### 4️⃣ SonarQube Scan

```bash
docker run --rm \
  -e SONAR_HOST_URL=http://3.111.96.69:9000 \ 
  -e SONAR_LOGIN=$SONAR_TOKEN \
  -v /var/lib/jenkins/workspace/Hostar_Clone:/usr/src \
  sonarsource/sonar-scanner-cli \
    -Dsonar.projectKey=hotstar-app \
    -Dsonar.projectName=hotstar-app \
    -Dsonar.sources=src \
    -Dsonar.exclusions=**/node_modules/**,**/build/**
```

Results accessible at:

```bash
http://3.111.96.69:9000/dashboard?id=hotstar-app
```
[![Watch the Demo](./assets/Screenshot%202025-12-08%20191838.png)](./assets/Screen-Recording-2025-12-08-192152.mp4.mp4)

### 5️⃣ Build Docker Image

```bash
docker build -t maheshbharambe45/hotstar-app .
```

### 6️⃣ Docker Scout Scan (Image Vulnerabilities)

Installs Docker Scout CLI in workspace:

```bash
curl -sSfL https://raw.githubusercontent.com/docker/scout-cli/main/install.sh | \
  sh -s -- -b .docker-plugins
```

Scans image for CVEs

```bash
.docker-plugins/docker-scout cves maheshbharambe45/hotstar-app:latest
```

![Website Screenshot](assets/Screenshot%202025-12-08%20192306.png)

### 7️⃣ Push Docker Image

Log in to Docker Hub using MY_DOCKER_PASS

```bash
echo $MY_DOCKER_PASS | docker login -u maheshbharambe45 --password-stdin
```

Pushes image

```bash
docker push maheshbharambe45/hotstar-app:latest
```

![Website Screenshot](assets/Screenshot%202025-12-08%20192331.png)

### 8️⃣ Deploy to AWS EKS

Configures kubeconfig for hotstar-eks:

```bash
aws eks update-kubeconfig \
  --name hotstar-eks \
  --region ap-south-1 \
  --alias hotstar-eks
```

Applies Kubernetes manifests

```bash
kubectl apply -f deployment.yml
kubectl apply -f service.yml
```
![Website Screenshot](assets/Screenshot%202025-12-08%20192410.png)

Retrieves ELB hostname

```bash
kubectl get svc hotstar-service \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

Prints final URL

```bash
Deployed App URL: ab12b4...-1248999305.ap-south-1.elb.amazonaws.com
```

### 9️⃣ OWASP ZAP Baseline Scan

Creates report output folder

```bash
mkdir -p zap-output
chmod 777 zap-output
```

Runs ZAP baseline in Docker against ELB URL

```bash
docker run --rm \
  -v $PWD/zap-output:/zap/wrk:rw \
  ghcr.io/zaproxy/zaproxy:stable \
    zap-baseline.py \
    -t http://<elb-hostname> \
    -r zap_report.html \
    -I -m 5
```

### 🔟 Publish ZAP Report

Uses HTML Publisher plugin to publish zap-output/zap_report.html:
Appears in Jenkins build as: “OWASP ZAP Report”

![Website Screenshot](assets/Screenshot%202025-12-08%20192450.png)

### 🌐 Accessing the Application

Find the line in Jenkins log

```bash
Deployed App URL: <elb-hostname>.ap-south-1.elb.amazonaws.com
```

Open in browser:

```bash
http://<elb-hostname>.ap-south-1.elb.amazonaws.com

```
[![Watch the Demo](./assets/Screenshot%202025-12-08%20192504.png)](./assets/Screen-Recording-2025-12-08-192539.mp4.mp4)


## 🔒 Security Improvements 

- Fix **Docker Scout–reported vulnerabilities** by updating vulnerable NPM packages to their patched versions.
- Add **security headers** (e.g. `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`) to reduce OWASP ZAP warnings.
- Update the Jenkins pipeline to **fail the build** when:
  - Any **Critical/High CVEs** are detected by Docker Scout.
  - OWASP ZAP reports alerts above a defined **severity threshold** (e.g. High/Medium).


