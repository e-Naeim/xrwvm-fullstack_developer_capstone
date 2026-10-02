# fullstack_developer_capstone

Best Cars is a full-stack dealership review portal built on the IBM course starter.

## Features
- Static Home, About Us and Contact Us pages
- Six-field registration, login, logout and server-verified sessions
- Anonymous dealership directory, state filtering, details and sentiment-labeled reviews
- Authenticated reviews with optional purchase details and newest-first ordering
- Django admin for car makes and models, including validation and inline editing
- Express/Mongoose API, MongoDB persistence, and a separate Flask/NLTK VADER service
- React production build, automated tests, Dockerfiles, Compose and Kubernetes manifests

## Architecture
Browser → Django/React → Express → MongoDB; Django → sentiment microservice.
Django stores users and vehicle models in SQLite. Review identity comes from the authenticated Django session. Browser mutations require CSRF tokens. The Express write endpoint is a trusted internal service and must not be exposed as an unauthenticated production write API.

## Run the full stack with Docker
```sh
docker compose up --build
# In another terminal, create your own admin credentials interactively:
docker compose exec web python manage.py createsuperuser
```
Open http://localhost:8000. The Compose configuration is explicitly local/demo mode; only the web port is public. MongoDB and SQLite data persist in named volumes. Do not use demo mode for real personal data.

## Run without Docker
```sh
python -m venv .venv
. .venv/bin/activate
pip install -r server/requirements.txt -r server/djangoapp/microservices/requirements.txt
cd server/frontend && npm ci && npm run build && cd ../..
cd server/database && npm ci && npm run dev:local
# Separate terminal: real MongoDB is downloaded by mongodb-memory-server for local development.
cd server/djangoapp/microservices && python app.py
# Separate terminal, from repository root:
export DJANGO_DEBUG=1
python server/manage.py migrate
python server/manage.py seed_cars
python server/manage.py createsuperuser
python server/manage.py runserver 0.0.0.0:8000
```
Alternatively run an installed MongoDB service and set MONGO_URL before `npm start` in server/database. No JSON mock database is used. Runtime URLs can be set with `backend_url` and `sentiment_analyzer_url`.

## Tests
```sh
DJANGO_DEBUG=1 python server/manage.py test djangoapp -v 2
(cd server/frontend && CI=true npm test -- --watchAll=false --runInBand && CI=true npm run build)
(cd server/database && npm test && node tests/mongo.integration.js)
(cd server/djangoapp/microservices && python -m unittest -v)
```
Django/React/Express unit tests isolate external services. `mongo.integration.js` separately tests a real MongoDB process, seed persistence, concurrent review IDs, filtering, and ordering. Evidence distinguishes unit tests from live integration and deployment.

## API routes
- GET /djangoapp/session (sets the CSRF cookie)
- POST /djangoapp/register, /djangoapp/login, /djangoapp/logout
- GET /djangoapp/get_dealers[/STATE], /djangoapp/dealer/ID
- GET /djangoapp/reviews/dealer/ID, /djangoapp/get_cars
- POST /djangoapp/add_review (authenticated)
- Express: /fetchDealers, /fetchDealers/Kansas, /fetchDealer/3, /fetchReviews/dealer/29, /insert_review
- Sentiment: /analyze/Fantastic%20services

Logout deliberately uses POST plus CSRF protection; a GET does not change the session.

## Production deployment
Production is the default: set DJANGO_SECRET_KEY, DJANGO_ALLOWED_HOSTS (include localhost for probes), and DJANGO_CSRF_TRUSTED_ORIGINS. Serve HTTPS. Never publish secrets in Git. Set DJANGO_DEBUG=1 only for explicit local/synthetic demos.

The root `deployment.yaml` is a parameterized Kubernetes template. Replace YOUR_REGISTRY, supply the named ConfigMap and Secret securely, build/push the three images, then apply it in your authorized cluster. Keep database and sentiment services internal. Production credentials, paid cloud resources, registry access and ingress are intentionally not created by this repository.

## Submission status and evidence
See [SUBMISSION.md](SUBMISSION.md) for verified results and outstanding deployment evidence. A workflow or deployment file is not proof that it has run. Only genuine test output and screenshots should be submitted. The final Coursera Submit action and honor checkboxes remain with the learner.

## Credits
Starter: [IBM Developer Skills Network](https://github.com/ibm-developer-skills-network/xrwvm-fullstack_developer_capstone). Original starter assets and sample datasets retained under its license. Team portraits are original AI-generated fictional adults, created for this educational project; names and contact details are fictional. The initially evaluated Random User images were not published because live-use licensing was not clear. Sentiment uses the starter's bundled NLTK VADER lexicon.
