from .db import lock
from .models import Item, Bidding, Profile
from .serializers import ItemSerializer, BiddingSerializer, ProfileSerializer

from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import NotFound, AuthenticationFailed


class ProfileRetrieveUpdate(generics.RetrieveUpdateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = ProfileSerializer
    lookup_field = 'pk'

    def get_object(self):
        # lookup_field is ignored here
        try:
            profile = self.request.user.profile
        except Profile.DoesNotExist:
            raise NotFound()

        return profile


class ItemList(generics.ListAPIView):
    permission_classes = (IsAuthenticated,)

    serializer_class = ItemSerializer

    def get_queryset(self):
        """
        This view should return a list of all the biddings
        optionally filtered with the currently authenticated user.
        """
        queryset = Item.objects.all()
        item_id = self.request.query_params.get('id')
        if item_id is not None:
            queryset = queryset.filter(id=item_id)

        return queryset


class BiddingListCreate(generics.ListCreateAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = BiddingSerializer

    def get_queryset(self):
        """
        This view should return a list of all the biddings
        filtered with the currently authenticated user.
        """
        queryset = Bidding.objects.filter(profile=self.request.user.profile)

        item = self.request.query_params.get('item')
        if item is not None:
            queryset = queryset.filter(item=item)

        return queryset

    def perform_create(self, serializer):
        instance = serializer.save(profile=self.request.user.profile)
        cur_bid = instance.bid
        profile = instance.profile
        item = instance.item

        # lock the thread before proceeding
        lock.acquire()
        try:
            while True:
                """
                find the next auto bidder, increase the bid by 1,
                and add the bidder to the end of the list to prevent
                starving
                """
                auto_biddings = Bidding.objects \
                    .filter(item=item, auto_bid=True, profile__max_bid_amount__gt=0) \
                    .exclude(profile=profile) \
                    .select_related('profile', 'item') \
                    .order_by('created_at')
                if not auto_biddings.exists():
                    break

                auto_bidding = next(iter(auto_biddings))
                cur_bid += 1
                Bidding.objects.create(profile=auto_bidding.profile,
                                       item=item,
                                       bid=cur_bid,
                                       auto_bid=True)

                auto_bidding.auto_bid = False
                auto_bidding.save()
                profile = auto_bidding.profile
                profile.max_bid_amount -= 1
                profile.save()
        finally:
            lock.release()
