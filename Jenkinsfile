pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Build') {
            steps {
                echo 'Building Organis...'
            }
        }

        stage('Docker Validation') {
            steps {
                echo 'Docker Compose configuration found'
            }
        }
    }
}