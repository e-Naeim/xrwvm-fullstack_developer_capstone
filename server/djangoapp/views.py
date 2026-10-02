import json
from datetime import date
from functools import wraps
from urllib.parse import quote
import requests
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.db import IntegrityError
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET, require_POST
from .models import CarModel
from .restapis import (get_request, post_review,
                       analyze_review_sentiments)


def error(message, status=400):
    return JsonResponse({'error': message, 'status': status}, status=status)


def body(request):
    data = json.loads(request.body)
    if not isinstance(data, dict):
        raise ValueError('Expected a JSON object.')
    return data


def api_guard(view):
    @wraps(view)
    def wrapped(*args, **kwargs):
        try:
            return view(*args, **kwargs)
        except (ValueError, KeyError, TypeError, json.JSONDecodeError):
            return error('Invalid or missing input.')
        except requests.RequestException:
            return error('A backend service is unavailable. Please try again.', 503)
    return wrapped


def identity(user):
    return {'userName': user.username, 'firstName': user.first_name,
            'lastName': user.last_name, 'status': 'Authenticated'}


@ensure_csrf_cookie
@require_GET
def session(request):
    return JsonResponse(identity(request.user) if request.user.is_authenticated
                        else {'userName': '', 'status': 'Anonymous'})


@require_POST
@api_guard
def login_user(request):
    data = body(request)
    user = authenticate(request, username=data['userName'], password=data['password'])
    if user is None:
        return error('Invalid username or password.', 401)
    login(request, user)
    return JsonResponse(identity(user))


@require_POST
def logout_request(request):
    logout(request)
    return JsonResponse({'userName': ''})


@require_POST
@api_guard
def registration(request):
    data = body(request)
    fields = ['userName', 'firstName', 'lastName', 'email', 'password']
    if any(not isinstance(data.get(key), str) or not data[key].strip()
           for key in fields):
        return error('All fields are required.')
    if data['password'] != data.get('confirmPassword', data['password']):
        return error('Passwords do not match.')
    username = data['userName'].strip()
    email = data['email'].strip()
    if len(username) > 150 or len(email) > 254:
        return error('Username or email is too long.')
    user = User(username=username, first_name=data['firstName'].strip(),
                last_name=data['lastName'].strip(), email=email)
    try:
        User._meta.get_field('username').run_validators(username)
        for field in ['first_name', 'last_name']:
            User._meta.get_field(field).clean(getattr(user, field), user)
        validate_email(email)
        validate_password(data['password'], user)
    except ValidationError as exc:
        return error(' '.join(exc.messages))
    if User.objects.filter(username__iexact=username).exists():
        return error('Already Registered', 409)
    try:
        user.set_password(data['password'])
        user.save()
    except IntegrityError:
        return error('Already Registered', 409)
    login(request, user)
    return JsonResponse(identity(user), status=201)


@require_GET
@api_guard
def get_dealerships(request, state='All'):
    endpoint = 'fetchDealers' if state in ('All', '') else 'fetchDealers/' + quote(state)
    return JsonResponse({'status': 200, 'dealers': get_request(endpoint)})


@require_GET
@api_guard
def get_dealer_details(request, dealer_id):
    dealers = get_request(f'fetchDealer/{dealer_id}')
    if not dealers:
        return error('Dealership not found.', 404)
    return JsonResponse({'status': 200, 'dealer': dealers})


@require_GET
@api_guard
def get_dealer_reviews(request, dealer_id):
    reviews = get_request(f'fetchReviews/dealer/{dealer_id}')
    for review in reviews:
        review['sentiment'] = analyze_review_sentiments(review['review'])
    return JsonResponse({'status': 200, 'reviews': reviews})


@require_GET
def get_cars(request):
    cars = [{'id': model.id, 'CarMake': model.car_make.name,
             'CarModel': model.name, 'year': model.year, 'type': model.type}
            for model in CarModel.objects.select_related('car_make').all()]
    return JsonResponse({'status': 200, 'CarModels': cars})


@require_POST
@api_guard
def add_review(request):
    if not request.user.is_authenticated:
        return error('Please log in to post a review.', 401)
    data = body(request)
    if not isinstance(data.get('review'), str):
        return error('Review must be text.')
    review = data['review'].strip()
    if not review or len(review) > 5000:
        return error('Write a review of 1–5000 characters.')
    dealer = int(data['dealership'])
    if not get_request(f'fetchDealer/{dealer}'):
        return error('Dealership not found.', 404)
    purchase = data.get('purchase', False)
    if not isinstance(purchase, bool):
        return error('Purchase must be true or false.')
    payload = {'dealership': dealer, 'review': review, 'purchase': purchase,
               'name': request.user.get_full_name() or request.user.username,
               'user_id': request.user.id, 'purchase_date': '',
               'car_make': '', 'car_model': '', 'car_year': None}
    if purchase:
        purchase_date = date.fromisoformat(data['purchase_date'])
        if purchase_date > date.today():
            return error('Purchase date cannot be in the future.')
        year = int(data['car_year'])
        if not 2015 <= year <= 2023:
            return error('Car year must be between 2015 and 2023.')
        if not CarModel.objects.filter(car_make__name=data['car_make'],
                                       name=data['car_model']).exists():
            return error('Choose a listed car make and model.')
        payload.update({key: data[key] for key in
                        ['purchase_date', 'car_make', 'car_model']})
        payload['car_year'] = year
    saved = post_review(payload)
    return JsonResponse({'status': 200, 'review': saved}, status=201)
