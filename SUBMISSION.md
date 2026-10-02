# Capstone submission preparation

## Verified locally (2 October 2026)
- React production build completed successfully
- 19 Django tests passed (CSRF, registration/login/logout, server-derived review identity, validation, admin, static and React routes, service failures)
- 5 React tests passed (anonymous/authenticated directory, repeat filtering, six-field registration validation, Cancel navigation, protected review route)
- 9 Express route unit tests passed with mocked model calls
- 4 actual VADER sentiment tests passed, including Fantastic services → positive
- Django migrations and system checks passed; Python lint passed
- Actual Django development server started and returned HTTP 200 for About and session routes

Raw, unedited test output is in `evidence/`. These unit tests do not establish that the MongoDB deployment, Kubernetes cluster, or public application works.

## Outstanding evidence before final submission
1. Live MongoDB integration: this environment can download the official MongoDB executable, but startup fails with `open: Operation not permitted`. The real-database integration test is included for a supported lab/CI runner
2. GitHub Actions result for the published commit, including real MongoDB integration and Docker builds
3. Skills Network / Code Engine / Kubernetes deployment and real public URL
4. Genuine browser screenshots for anonymous/authenticated lists, state filter, dealer details/reviews, review creation, admin login/logout and make/model management
5. Deployed login, details and review-post evidence
6. Final Coursera attachments, learner checkboxes and Submit

Do not mark these outstanding criteria complete or replace live screenshots with mockups.

## Evidence files and source mapping
- README project heading: `README.md`
- Django startup: `evidence/django_server.txt`
- About / Contact: `server/frontend/static/About.html`, `Contact.html`
- Login / logout / register: `server/djangoapp/views.py`, `urls.py`
- Six-field form: `server/frontend/src/components/Register/Register.jsx`
- REST dealerships / Kansas / dealer / reviews: `server/database/app.js`
- Makes, models and admin: `server/djangoapp/models.py`, `admin.py`, migrations
- Sentiment: `server/djangoapp/microservices/app.py`; `evidence/sentiment-tests.txt`
- Anonymous/auth listings and filtering: `server/frontend/src/components/Dealers/Dealers.jsx`
- Details / reviews: `server/frontend/src/components/Dealers/Dealer.jsx`
- Review form: `server/frontend/src/components/Dealers/PostReview.jsx`
- CI: `.github/workflows/main.yml`
- Containerization: three Dockerfiles, root `docker-compose.yml`, `deployment.yaml`

## Notes for the learner
The Express service is intentionally private behind Django. In a lab, REST evidence may be captured with terminal curl inside the service network. Do not expose its write endpoint to real user traffic without service-to-service authentication.

The final submission must distinguish locally verified implementation from cloud deployment. Keep honor/verification checkboxes and Submit for the learner to inspect and complete.
