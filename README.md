# Odeals-Checker

## Setup

Must create a `.env` and watchlist.csv file. There is a sample of each you can use

The following configuration variables are used:

    SMTP_HOSTNAME
    SMTP_PORT
    SMTP_USERNAME
    SMTP_PASSWORD

For gmail, the SMTP hostname is "smtp.gmail.com". The username is your full email address including the @gmail.com. If your Google account requires two factor authentication, your Google password won't work. Instead, you'll need to use an application specific password. Google appears to have removed the link to application specific passwords from the account security page, but as of March 2023, you can still create application specific passwords by this direct link to the [application specific password page](https://myaccount.google.com/apppasswords)

Add these variables to two places: a .env file locally in this repo and in github repo secrets

The .env file should contain one line per configuration variable. For example:

    SMTP_HOSTNAME="smtp.gmail.com"

## Running locally

    npm start

## Setup Github actions

Remove watchlist.csv from .gitignore
In your github repo, click settings > Secrets and Variables > Actions
Click "New Repository Secret". "SMTP_HOSTNAME" for the name, and "smtp.gmail.com" for the secret. Don't add quotes or newlines. Repeat for all other secrets

## Run Github actions

Github projects > Actions > "Report"

## Disable / Re-enable workflow

Github > Repo > Actions tab > Click Report on the left > Click triple elipsis on right, Disable
