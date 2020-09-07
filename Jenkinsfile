def archive_file = "shared-todolist.tgz"

node('nodejs12') {
    stage('pulling code') {
        checkout scm
    }
    
    stage('Building') {
        sh label: 'Installing deps', script: 'npm ci --no-progress'
    }

    stage('Tarring tarball') {
        sh label: 'Making tarball', script: "tar cvzf ${archive_file} ./dist"
    }
    stage('Archiving') {
        archiveArtifacts artifacts: "${archive_file}", defaultExcludes: false, followSymlinks: false, onlyIfSuccessful: true
    }
}