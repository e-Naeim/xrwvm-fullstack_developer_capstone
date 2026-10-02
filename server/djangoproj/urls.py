from django.contrib import admin
from django.urls import path, include, re_path
from django.views.generic import TemplateView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('djangoapp/', include('djangoapp.urls')),
    re_path(r'^$', TemplateView.as_view(template_name='Home.html')),
    re_path(r'^about/?$', TemplateView.as_view(template_name='About.html')),
    re_path(r'^contact/?$', TemplateView.as_view(template_name='Contact.html')),
    re_path(r'^(login|register|dealers|dealer/\d+|postreview/\d+)/?$',
            TemplateView.as_view(template_name='index.html')),
]
