[![wakatime](https://wakatime.com/badge/github/imranbarbhuiya/Mehrin.svg)](https://wakatime.com/badge/github/imranbarbhuiya/Mehrin?style=for-the-badge)
[![CodeFactor](https://www.codefactor.io/repository/github/imranbarbhuiya/mehrin/badge?s=8ec0efcbcfcd28a06993345c91ab1c635beb01be&style=for-the-badge)](https://www.codefactor.io/repository/github/imranbarbhuiya/mehrin)

# R.O.T.I

The ultimate bot for your server.
A multipurpose bot packed with features !

## Setup

To get ready to work on the codebase, please do the following:

### Getting your workspace ready

- Fork & clone the repository, and make sure you're on the main branch
- Create a new branch for your work
- Run `yarn install`
- Code your heart out!
- Ensure your changes compile (`yarn build`) and passes both typecheck (`yarn typecheck`) and lint (`yarn lint`)
- You can start compiling in watch mode with yarn watch
- You can start a dev server with yarn dev
- Push your changes and submit a pull request

### Notes

- You need to have nodejs 16.9.0 or above installed
  - [Download](https://nodejs.org/en/download/)
- You need to install Visual Studio 2017 or later with `Desktop development with C++` workload
  - You need python 3 installed
- We use `yarn` package manager, It's recommended to install it
  - To do this, run `npm install -g yarn`
- We use mongodb database. So you either need a local mongodb server running or create an account on mongodb cloud
  - [Create an account on mongodb cloud](https://mongodb.com/)
- You need to create a bot application
  - [Create an application](https://discordapp.com/developers/applications)

## .env Setup

- You need to create a .env file in the root of the workspace where you can store all your sensitive data.
  - Don't commit this file to your repository
- inside the .env file, you need to add the following variables:
  - `DISCORD_TOKEN`: Your bot token
  - `MONGODB_SRV`: Your mongodb uri
  - `ERROR_WEBHOOK_URL`: Your error webhook url
  - `STATUS_WEBHOOK_URL`: Your status webhook url
  - `REPORT_WEBHOOK_URL`: Your report webhook url
