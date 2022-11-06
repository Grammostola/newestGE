import fs from 'fs'
import fsPromise from 'fs/promises'
import { pipeline } from 'stream/promises'
import tar from 'tar'
import { homedir } from 'os'
import path from 'path'
import chalk from 'chalk'
import ora from 'ora'

const errorColor = chalk.bold.red
const warningColor = chalk.hex('#FFA500')
const okColor = chalk.bold.blue

getLatestProtonGE().then(releaseName => {
  console.log(okColor(`${releaseName} was installed, please (re)start Steam.`))
}, error => {
  console.log(errorColor(error))
})

/**
 * Check if the latest release of Proton-GE is installed for the current user's Steam,
 * if so exit and inform, else download and install
 */
async function getLatestProtonGE () { // todo: check for .steam/root, if not present abort, if present check for compatibilitytools.d and create if not present
  const steamFolder = `${homedir()}/.steam/root/`
  const steamPresent = await getExists(steamFolder)
  if (!(steamPresent)) {
    throw new Error(`A Steam folder was not found at the predicted location: ${steamFolder} and the script will halt.`)
  }
  const compatibilitytoolsFolder = `${homedir()}/.steam/root/compatibilitytools.d/`
  const compatFolderPresent = await getExists(compatibilitytoolsFolder)
  if (!(compatFolderPresent)) {
    // inform and attempt to create the folder
    // read write execute, read execute, execute just like user-created folder under homefolder
    console.log(warningColor(`${compatibilitytoolsFolder} was not found and has been created.`))
    await fsPromise.mkdir(compatibilitytoolsFolder, 751)
  }
  const fileInfoObj = await getTarDetails()
  const releaseName = fileInfoObj.filename.slice(0, fileInfoObj.filename.indexOf('.tar.gz'))
  const releasePresent = await getExists(path.join(steamFolder, releaseName))
  if (releasePresent) {
    console.log(warningColor(`${releaseName} already appears in ${steamFolder}, exiting.`))
    process.exit(0)
  }
  const downloadSpinner = ora(createOraOptionsObject('Downloading the latest release')).start()
  await downloadTar(fileInfoObj)
  downloadSpinner.stop()
  const unTarSpinner = ora(createOraOptionsObject('Unpacking into the relevant Steam folder')).start()
  await unTarToSteam(fileInfoObj, steamFolder)
  unTarSpinner.stop()
  return releaseName

  function createOraOptionsObject (text) {
    return {
      text,
      spinner: 'dots5',
      color: 'blue'
    }
  }

  async function getTarDetails () {
    const releaseReply = await fetch('https://api.github.com/repos/GloriousEggroll/proton-ge-custom/releases/latest')
    if (!releaseReply.ok) throw new Error(`Unexpected fetch response: ${releaseReply.statusText}`)
    const release = await releaseReply.json()
    const assetDescriptor = release.assets.find(asset => asset.name.endsWith('.tar.gz'))
    const filename = assetDescriptor.name
    const assetUrl = assetDescriptor.url

    const assetReply = await fetch(assetUrl)
    const asset = await assetReply.json()
    return {
      url: new URL(asset.browser_download_url),
      filename
    }
  }

  async function getExists (location) {
    try {
      await fsPromise.access(location)
      return true
    } catch (error) {
      return false
    }
  }

  async function downloadTar ({ url, filename }) {
    const downloadReply = await fetch(url)
    if (!downloadReply.ok) throw new Error(`Unexpected fetch response: ${downloadReply.statusText}`)
    return pipeline(downloadReply.body, fs.createWriteStream(filename))
  }

  async function unTarToSteam ({ filename }, steamFolder) {
    return await tar.x({
      file: filename,
      C: steamFolder
    })
  }
}
