#!/bin/bash

APP_NAME="dev-kockraco-api"
APP_DIR="/root/kockraco/restaurant-api"
BRANCH="develop"

BUILD=false

GIT_USERNAME="yourgithubuser"
GIT_PAT="ghp_xxxxxxxxxxxxxxxxx"

REPO_URL="https://${GIT_USERNAME}:${GIT_PAT}@github.com/${GIT_USERNAME}/restaurant-api.git"

echo "================================="
echo "Starting deployment..."
echo "================================="

# Go to app directory
cd $APP_DIR || exit 1

# Update git remote with PAT
git remote set-url origin $REPO_URL

echo "Pulling latest code..."
git pull origin $BRANCH

if [ $? -ne 0 ]; then
    echo "Git pull failed!"
    exit 1
fi

echo "Installing dependencies..."
npm install --force

# Optional build step
if [ "$BUILD" = true ]; then
    if grep -q "\"build\"" package.json ; then
        echo "Running build..."
        npm run build
    fi
fi

echo "Restarting PM2..."
pm2 restart $APP_NAME

pm2 save

echo "================================="
echo "Deployment completed!"
echo "================================="