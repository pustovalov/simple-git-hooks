const fs = require('fs')
const os = require("os");
const findGitRoot = require('find-git-root')

/**
 * Checks the 'simple-pre-commit' in dependencies of the project
 * @return {Boolean}
 */
function simplePreCommitInDevDependencies(packageJsonData) {
    // if simple-pre-commit in dependencies -> note user that he should remove move it!
    if (!('dependencies') in packageJsonData && 'simple-pre-commit' in packageJsonData.dependencies) {
        console.log('[WARN] You should move simple-pre-commit to the devDependencies')
    }
    if (!('devDependencies' in packageJsonData)) {
        return false
    }
    return 'simple-pre-commit' in packageJsonData.devDependencies
}

/** Reads package.json file, returns file buffer
 * @return {{packageJsonContent: any, packageJsonPath: string}}
 * @throws ValueError if cant read package.json
 * @private
 */
function getPackageJson() {
    const targetPackageJson = process.cwd() + '/package.json'

    if (!fs.statSync(targetPackageJson).isFile()) {
        console.log("[ERROR] Was not able to create a pre-commit hook. Reason: package.json doesn't exist")
    }

    const packageJsonDataRaw = fs.readFileSync(targetPackageJson)
    return { packageJsonContent: JSON.parse(packageJsonDataRaw), packageJsonPath: targetPackageJson }
}

/**
 * Gets current command from package.json[simple-pre-commit]
 * @throws ValueError if package.json couldn't be read
 * @return {undefined | string}
 */
function getCommandFromPackageJson() {
    const {packageJsonContent} = getPackageJson()
    return packageJsonContent['simple-pre-commit']
}

/**
 * Sets provided command to package.json[simple-pre-commit]
 * @param {string} command
 * @throws ValueError if package.json couldn't be read
 * @throws TypeError if command is not string
 */
function setCommandInPackageJson(command) {
    if (typeof command !== 'string') {
        throw TypeError('[ERROR] Internal error: Supplied command was not string!')
    }

    const {packageJsonContent, packageJsonPath} = getPackageJson()

    const newPackageJson =  {...packageJsonContent}
    newPackageJson['simple-pre-commit'] = command

    fs.writeFile(packageJsonPath, JSON.stringify(newPackageJson), function (err) {
        if (err) throw err;
    });
}

/**
 * Creates or replaces an existing executable script in .git/hooks/pre-commit with provided command
 * @param {string} command
 */
function setPreCommitHook(command) {
    const gitRoot = findGitRoot(process.cwd())

    const preCommitHook = "#!/bin/sh" + os.EOL + command

    fs.writeFile(gitRoot + '/hooks/pre-commit', preCommitHook, function (err) {
        if (err) throw err;
    });
}

module.exports = {
    packageInDevDependencies: simplePreCommitInDevDependencies,
    setPreCommitHook,
    getPackageJson,
    getCommandFromPackageJson,
    setCommandInPackageJson
}