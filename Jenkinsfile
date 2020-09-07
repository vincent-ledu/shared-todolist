def archive_file = "shared-todolist.tgz"

node('nodejs12') {
    stage('pulling code') {
        checkout scm
    }
    
    stage('Building') {
        sh label: 'Installing deps', script: 'npm ci --no-progress'
    }

    stage('Tarring tarball') {
        sh label: 'Making tarball', script: "cd .. && tar --exclude='.env.sample' -cvzf ${archive_file} SharedTodolist"
    }
    stage('Archiving') {
        archiveArtifacts artifacts: "${archive_file}", defaultExcludes: false, followSymlinks: false, onlyIfSuccessful: true
    }
}