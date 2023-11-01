### Intro
newestGE is a small nodejs script for downloading the latest release of [Proton-GE](https://github.com/GloriousEggroll/proton-ge-custom#native) and unpacking it in the relevant Steam subfolder (which it will create if missing)(if the relevant Steam parent folder isn't found the script will halt and inform). The script will halt and inform (before downloading) if the latest release already appears present in said folder so it should be safe to run at any time. It can optionally delete prior Proton-GE releases from the relevant Steam subfolder. 

(It does the same thing as the Installation - Manual - Native instructions on the page referenced above. I was doing it manually again and thought about automating it via Github's API. I also learnt something about streams and pipes. It's here because someone else might find it useful or offer useful advice on how to make it better.)

### Prerequisites
- Node 20.x LTS works without warnings about native fetch being experimental
- The native version of Steam rather than the flatpak version, the latter has another way of installing/updating Proton-GE, see 
[Proton-GE](https://github.com/GloriousEggroll/proton-ge-custom#flatpak)

### Installation
Clone this repo, install the deps (`npm install`) 

(if it was going to be a lot longer than a oneliner of Bash script that looked a bit complicated I wanted some niceties like a loading indicator :) ) 

### Running
It can make sense on a weekly schedule or so (it shouldn't change the filesystem any if there isn't a newer release)


To run:
`node newestGE.js`

(optionally `node newestGE.js --delete-earlier` to delete prior versions of Proton-GE already installed. Defaults to false)

```
node newestGE.js --delete-earlier
Downloading the latest release..
 ■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■■ 100%
✔ Deleting installed earlier ProtonGE versions if present
✔ Extracting archive into the relevant Steam folder
✔ Deleting the downloaded archive file
GE-Proton8-22 was installed, please (re)start Steam.
```

### Contributions
Feel free to create an issue or a PR based on an issue.

#### Code style
Standard.js. 

#### License
MIT
