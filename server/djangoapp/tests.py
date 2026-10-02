import json
from unittest.mock import patch
import requests
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
from django.test import Client, TestCase
from .models import CarMake, CarModel


class AccountTests(TestCase):
    def setUp(self):
        self.client = Client(enforce_csrf_checks=True)
        self.client.get('/djangoapp/session')
        self.registration = dict(userName='reviewer', firstName='Demo', lastName='Reviewer',
                                 email='reviewer@example.test', password='Test-only-pass-918!',
                                 confirmPassword='Test-only-pass-918!')

    def post(self, route, data):
        return self.client.post('/djangoapp/' + route, json.dumps(data),
                                content_type='application/json',
                                HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value)

    def test_registration_session_logout_login(self):
        response = self.post('register', self.registration)
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.json()['status'], 'Authenticated')
        user = User.objects.get(username='reviewer')
        self.assertNotEqual(user.password, self.registration['password'])
        self.assertTrue(user.check_password(self.registration['password']))
        self.assertEqual(self.client.get('/djangoapp/session').json()['userName'], 'reviewer')
        self.assertEqual(self.post('logout', {}).json()['userName'], '')
        self.assertEqual(self.client.get('/djangoapp/session').json()['status'], 'Anonymous')
        self.assertEqual(self.post('login', self.registration).status_code, 200)

    def test_csrf_required(self):
        response = self.client.post('/djangoapp/register', json.dumps(self.registration),
                                    content_type='application/json')
        self.assertEqual(response.status_code, 403)

    def test_duplicate_registration(self):
        self.post('register', self.registration)
        self.assertEqual(self.post('register', self.registration).status_code, 409)

    def test_registration_rejects_mismatched_password(self):
        self.registration['confirmPassword'] = 'different'
        self.assertEqual(self.post('register', self.registration).status_code, 400)
        self.assertEqual(User.objects.count(), 0)

    def test_registration_rejects_weak_password_and_bad_email(self):
        self.registration.update(password='12345678', confirmPassword='12345678')
        self.assertEqual(self.post('register', self.registration).status_code, 400)
        self.registration['email'] = 'invalid-email'
        self.assertEqual(self.post('register', self.registration).status_code, 400)

    def test_registration_rejects_long_name(self):
        self.registration['firstName'] = 'a' * 151
        self.assertEqual(self.post('register', self.registration).status_code, 400)

    def test_invalid_login(self):
        self.assertEqual(self.post('login', self.registration).status_code, 401)

    def test_malformed_json(self):
        response = self.client.post('/djangoapp/login', '{', content_type='application/json',
                                    HTTP_X_CSRFTOKEN=self.client.cookies['csrftoken'].value)
        self.assertEqual(response.status_code, 400)

    def test_get_logout_does_not_mutate_session(self):
        self.assertEqual(self.client.get('/djangoapp/logout').status_code, 405)


class DealerTests(TestCase):
    @patch('djangoapp.views.get_request')
    def test_dealers_and_state(self, fetch):
        fetch.return_value = [{'id': 1, 'state': 'Kansas'}]
        self.assertEqual(self.client.get('/djangoapp/get_dealers').json()['dealers'][0]['id'], 1)
        self.client.get('/djangoapp/get_dealers/Kansas')
        fetch.assert_called_with('fetchDealers/Kansas')
        self.client.get('/djangoapp/get_dealers/All')
        fetch.assert_called_with('fetchDealers')

    @patch('djangoapp.views.get_request', return_value=[])
    def test_missing_dealer(self, fetch):
        self.assertEqual(self.client.get('/djangoapp/dealer/999').status_code, 404)

    @patch('djangoapp.views.get_request', side_effect=requests.ConnectionError)
    def test_service_unavailable(self, fetch):
        self.assertEqual(self.client.get('/djangoapp/get_dealers').status_code, 503)

    @patch('djangoapp.views.analyze_review_sentiments', return_value='positive')
    @patch('djangoapp.views.get_request', return_value=[{'id': 1, 'review': 'Fantastic services'}])
    def test_review_sentiment(self, fetch, sentiment):
        response = self.client.get('/djangoapp/reviews/dealer/1')
        self.assertEqual(response.json()['reviews'][0]['sentiment'], 'positive')

    def test_anonymous_review_denied(self):
        response = self.client.post('/djangoapp/add_review', '{}', content_type='application/json')
        self.assertEqual(response.status_code, 401)

    def test_review_requires_string(self):
        self.client.force_login(User.objects.create_user('reviewer'))
        for value in [None, {}, 42]:
            response = self.client.post('/djangoapp/add_review', json.dumps({'review': value}), content_type='application/json')
            self.assertEqual(response.status_code, 400)

    @patch('djangoapp.views.post_review')
    @patch('djangoapp.views.get_request', return_value=[{'id': 1}])
    def test_review_author_comes_from_session(self, fetch, post):
        user = User.objects.create_user('reviewer', first_name='Trusted', last_name='Name')
        self.client.force_login(user)
        post.return_value = {'id': 101}
        data = {'dealership': 1, 'review': 'Fantastic services', 'purchase': False,
                'name': 'Spoofed name', 'user_id': 999}
        response = self.client.post('/djangoapp/add_review', json.dumps(data), content_type='application/json')
        self.assertEqual(response.status_code, 201)
        payload = post.call_args.args[0]
        self.assertEqual(payload['name'], 'Trusted Name')
        self.assertEqual(payload['user_id'], user.id)

    @patch('djangoapp.views.get_request', return_value=[{'id': 1}])
    def test_purchase_validation(self, fetch):
        self.client.force_login(User.objects.create_user('reviewer'))
        data = {'dealership': 1, 'review': 'Nice', 'purchase': True,
                'purchase_date': '2099-01-01', 'car_year': 2023, 'car_make': 'Audi', 'car_model': 'A4'}
        self.assertEqual(self.client.post('/djangoapp/add_review', json.dumps(data),
                         content_type='application/json').status_code, 400)

    def test_car_models_and_admin(self):
        make = CarMake.objects.create(name='Audi')
        model = CarModel.objects.create(car_make=make, name='A4', year=2023)
        self.assertEqual(str(model), 'Audi A4 (2023)')
        self.assertEqual(self.client.get('/djangoapp/get_cars').json()['CarModels'][0]['CarMake'], 'Audi')
        model.year = 2000
        with self.assertRaises(ValidationError):
            model.full_clean()
        admin = User.objects.create_superuser('admin', 'admin@example.test', 'Test-only-pass-918!')
        self.client.force_login(admin)
        self.assertEqual(self.client.get('/admin/djangoapp/carmake/').status_code, 200)
        self.assertEqual(self.client.get('/admin/djangoapp/carmodel/').status_code, 200)

    def test_static_and_react_routes(self):
        for path in ['/', '/about/', '/contact/', '/login', '/register', '/dealers', '/dealer/1', '/postreview/1']:
            with self.subTest(path=path):
                self.assertEqual(self.client.get(path).status_code, 200)
