SHELL := /bin/bash

deploy-stg:
	rsync -avhzL --delete \
				--no-perms --no-owner --no-group \
				--exclude .git \
				--exclude .env \
				--exclude dist \
				--exclude node_modules \
				--filter=":- .gitignore" \
				. sinhvu@34.134.91.80:~/agentfai-api
	ssh -t sinhvu@34.134.91.80 "cd ./agentfai-api ; bash --login"

start-stg:
	npm i
	npm run build
	pm2 reload deploy/stg/api.json --update-env

stop-stg:
	pm2 stop agentfai

delete-stg:
	pm2 delete agentfai

start-prod:
	npm i
	npm run build
	pm2 reload deploy/prod/api.json --update-env

stop-prod:
	pm2 stop agentfai

delete-prod:
	pm2 delete agentfai
