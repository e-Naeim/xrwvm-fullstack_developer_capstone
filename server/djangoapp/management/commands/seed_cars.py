import json
from pathlib import Path
from django.conf import settings
from django.core.management.base import BaseCommand
from djangoapp.models import CarMake, CarModel


class Command(BaseCommand):
    help = 'Idempotently import the starter car makes and models.'

    def handle(self, *args, **options):
        source = Path(settings.BASE_DIR) / 'database/data/car_records.json'
        for car in json.loads(source.read_text())['cars']:
            make, _ = CarMake.objects.get_or_create(
                name=car['make'], defaults={'description': car['make'] + ' vehicles'})
            CarModel.objects.get_or_create(
                car_make=make, name=car['model'], year=car['year'],
                defaults={'type': car['bodyType'], 'dealer_id': car['dealer_id']})
        self.stdout.write(self.style.SUCCESS(
            f'{CarMake.objects.count()} makes; {CarModel.objects.count()} models'))
