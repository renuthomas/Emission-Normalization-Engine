from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # Change '' to 'api/' to prefix all routes inside myapp.urls
    path('api/', include('myapp.urls')), 
]
