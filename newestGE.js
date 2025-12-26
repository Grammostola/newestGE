import fsPromise from 'fs/promises'
import * as tar from 'tar'
import { homedir } from 'os'
import { oraPromise } from 'ora'
import path from 'path'
import chalk from 'chalk'
import yargs from 'yargs'
import globPromise from 'fast-glob'
import prog from 'cli-progress'

const errorColor = chalk.bold.red
const infoColor = chalk.hex('#b19cd19')
const okColor = chalk.bold.blue

const argv = yargs(process.argv.slice(2))
  .option('delete-earlier', {
    demand: false,
    default: false,
    type: 'boolean',
    describe: 'Delete installed earlier Proton-GE versions'
  }
  )
  .option('flatpak', {
    demand: false,
    default: false,
    type: 'boolean',
    describe: 'Install for flatpak version of Steam'
  }
  ).strictOptions()
  .argv

getLatestProtonGE(argv.deleteEarlier).then(releaseName => {
  console.log(okColor(`${releaseName} was installed, please (re)start Steam.`))
}, error => {
  console.log(errorColor(error))
})

/**
 * Check if the latest release of Proton-GE is installed for the current user's Steam,
 * if so exit and inform, else download and install.
 * Verify that the relevant Steam folder is present and create the necessary subfolder if necessary.
 * Optionally delete previous versions of Proton-GE already installed.
 */
async function getLatestProtonGE (deleteEarlier) {
  const steamFolder = argv.flatpak ? `${homedir()}/.var/app/com.valvesoftware.Steam/data/Steam` : `${homedir()}/.steam/root`
  const steamPresent = await getExists(steamFolder)
  if (!(steamPresent)) {
    throw new Error(`A Steam folder was not found at the predicted location: ${steamFolder} and the script will halt.`)
  }
  const compatibilitytoolsFolder = `${steamFolder}/compatibilitytools.d`
  const compatFolderPresent = await getExists(compatibilitytoolsFolder)
  if (!(compatFolderPresent)) {
    console.log(infoColor(`${compatibilitytoolsFolder} was not found and has been created.`))
    await fsPromise.mkdir(compatibilitytoolsFolder, '0751')
  }
  const fileInfoObj = await getTarDetails()
  const releaseName = fileInfoObj.filename.slice(0, fileInfoObj.filename.indexOf('.tar.gz'))
  const releasePresent = await getExists(path.join(compatibilitytoolsFolder, releaseName))
  if (releasePresent) {
    console.log(infoColor(`${releaseName} appears the newest and already appears in ${compatibilitytoolsFolder}, exiting.`))
    process.exit(0)
  }

  await downloadTar(fileInfoObj)

  if (deleteEarlier === true) {
    await oraPromise(deleteEarlierProtonGEs(), {
      spinner: 'noise',
      color: 'yellow',
      failText: 'There was a problem while attempting to delete installed earlier ProtonGE versions',
      text: 'Deleting installed earlier ProtonGE versions if present'
    })
  }

  await oraPromise(unTarToSteam(fileInfoObj, compatibilitytoolsFolder), {
    spinner: 'dots4',
    color: 'blue',
    failText: 'An error occured during archive extraction to Steam folder',
    text: 'Extracting archive into the relevant Steam folder'
  })

  await oraPromise(deleteProtonGE(fileInfoObj), {
    spinner: 'dots5',
    color: 'blue',
    failText: 'A problem occurred while attempting to delete the downloaded archive file',
    text: 'Deleting the downloaded archive file'
  })

  return releaseName

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

    const dLoadBar = new prog.SingleBar({
      format: ' {bar} {percentage}%',
      barCompleteChar: '\u25A0',
      barIncompleteChar: ' '
    })

    const contentLength = +downloadReply.headers.get('content-length')

    let receivedLength = 0
    const parts = []
    console.log('Downloading the latest release..')
    dLoadBar.start(contentLength / 100, 0)

    for await (const part of downloadReply.body) {
      parts.push(part)
      receivedLength += part.length
      dLoadBar.update(receivedLength / 100)
    }
    dLoadBar.stop()

    return fsPromise.writeFile(filename, parts)
  }

  function unTarToSteam ({ filename }, compatibilitytoolsFolder) {
    return tar.x({
      file: filename,
      C: compatibilitytoolsFolder
    })
  }

  function deleteProtonGE ({ filename, isDirectory }) {
    if (isDirectory) return fsPromise.rm(filename, { recursive: true })
    return fsPromise.unlink(filename)
  }

  async function deleteEarlierProtonGEs () {
    const earliers = await globPromise(`${compatibilitytoolsFolder}/GE-Proton*`, {
      onlyDirectories: true
    })
    return Promise.all(earliers.map(earlier => deleteProtonGE({ filename: earlier, isDirectory: true })))
  }
}
