#!/bin/bash

# Start the server
cross-env NODE_ENV=development npx @11ty/eleventy --serve --quiet &

# Wait for server to start
sleep 5

# Start tailwind watcher
npm run tailwind -- --watch

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
