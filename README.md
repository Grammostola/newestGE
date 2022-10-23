### Intro
newestGE is a small nodejs script for downloading the latest release of [GE-Proton](https://github.com/GloriousEggroll/proton-ge-custom) and unpacking it in the relevant Steam folder. The script will halt and inform (before downloading) if the latest release already appears present in said folder so it should be safe to run at any time. 

(It does the same thing as the Installation - Manual - Native instructions on the page referenced above. I was doing it manually again and thought about automating it via Github's API. I also learnt something about streams and pipes. It's here because someone else might find it useful or offer useful advice on how to make it better.)

### Prerequisites
The new native-to-nodejs fetch is employed so a newer version of node than v16 is required. Tested with v18.11.0 and v19.0.0. There may be a warning about the Fetch API being an experimental feature.

### Installation
Clone this repo, install the deps (if it was going to be a lot longer than a oneliner of Bash script that looked a bit complicated I wanted some niceties like a loading indicator :) ) 

### Running
It can make sense on a weekly schedule or so (it shouldn't change the filesystem any if there isn't a newer release)


To run:
`node newestGE.js`

### Contributions
Feel free to create an issue or a PR based on an issue.

#### Code style
Standard.js. (There might be a warning about 'fetch' not being defined)

#### License
MIT