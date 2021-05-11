from django.test import TestCase
from django.contrib.auth.models import User
from django.utils import timezone
from django.conf import settings

from bidding.views import *
from bidding.models import *
from bidding.serializers import *

from rest_framework import status
from rest_framework.test import APIRequestFactory, force_authenticate

factory = APIRequestFactory()


class ProfileRetrieveUpdateTest(TestCase):
    def setUp(self):
        self.url = '/api/profile/{}/'
        self.view = ProfileRetrieveUpdate.as_view()
        self.user = User.objects.create(username='user1')

    def test_retrieve_profile(self):
        user = self.user
        request = factory.get(self.url.format(user.profile.id))
        force_authenticate(request, user=user)
        response = self.view(request)
        self.assertEqual(response.data, {'id': user.profile.id, 'max_bid_amount': user.profile.max_bid_amount})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_update_profile(self):
        user = self.user
        data = {
            'id': user.profile.id,
            'max_bid_amount': user.profile.max_bid_amount + 1
        }
        request = factory.put(self.url.format(user.profile.id), data)
        force_authenticate(request, user=user)
        response = self.view(request)
        self.assertEqual(response.data, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
