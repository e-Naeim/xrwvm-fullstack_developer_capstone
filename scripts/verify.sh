#!/bin/sh
set -eu
export DJANGO_DEBUG=1
python server/manage.py check
python server/manage.py makemigrations --check --dry-run
python server/manage.py test djangoapp -v 2
(cd server/frontend && CI=true npm test -- --watchAll=false --runInBand && CI=true npm run build)
(cd server/database && npm test)
(cd server/djangoapp/microservices && python -m unittest -v)
# Requires permission to start the official MongoDB binary:
(cd server/database && node tests/mongo.integration.js)
