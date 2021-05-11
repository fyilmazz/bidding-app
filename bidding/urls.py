from django.urls import path
from . import views

urlpatterns = [
    path('api/item/', views.ItemList.as_view()),
    path('api/bidding/', views.BiddingListCreate.as_view()),
    path('api/profile/<int:pk>/', views.ProfileRetrieveUpdate.as_view()),
]
