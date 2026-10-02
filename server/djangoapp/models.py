from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models


class CarMake(models.Model):
    name = models.CharField(max_length=80, unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class CarModel(models.Model):
    TYPES = [('Sedan', 'Sedan'), ('SUV', 'SUV'), ('Wagon', 'Wagon'),
             ('Truck', 'Truck'), ('Coupe', 'Coupe'), ('Hatchback', 'Hatchback')]
    car_make = models.ForeignKey(CarMake, on_delete=models.CASCADE,
                                 related_name='models')
    dealer_id = models.PositiveIntegerField(null=True, blank=True)
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=20, choices=TYPES, default='Sedan')
    year = models.PositiveIntegerField(
        validators=[MinValueValidator(2015), MaxValueValidator(2023)])

    class Meta:
        ordering = ['car_make__name', 'name', '-year']
        constraints = [models.UniqueConstraint(
            fields=['car_make', 'name', 'year'], name='unique_car_model_year')]

    def __str__(self):
        return f'{self.car_make} {self.name} ({self.year})'
