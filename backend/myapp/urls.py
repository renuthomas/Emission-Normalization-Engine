from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

router = DefaultRouter()
router.register(r'review', views.DataReviewViewSet, basename='data-review')

urlpatterns = [
    path('ingest/', views.IngestionView.as_view(), name='ingest'),
    
    path('', include(router.urls)),
    
    path('auth/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
