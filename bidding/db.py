from threading import Lock

from .models import Bidding

# Note that this will not lock multiple processes!
lock = Lock()


def get_latest_bidding(item):
    try:
        return Bidding.objects.filter(item=item).latest('bid')
    except Bidding.DoesNotExist:
        return None


def get_latest_bidding_with_user(item):
    try:
        return Bidding.objects.filter(item=item).select_related('profile', 'profile__user').latest('bid')
    except Bidding.DoesNotExist:
        return None
