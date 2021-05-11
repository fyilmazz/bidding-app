from django.utils import timezone

from .models import *
from .db import *

from rest_framework import serializers
from rest_framework.validators import UniqueTogetherValidator


class ProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'max_bid_amount',)


class ItemSerializer(serializers.ModelSerializer):
    bid = serializers.SerializerMethodField()

    def get_bid(self, item):
        bidding = get_latest_bidding(item)
        if bidding is None:
            return 1

        return bidding.bid

    class Meta:
        model = Item
        fields = ('id', 'name', 'description', 'close_date', 'bid', 'photo')
        read_only_fields = ['name', 'description', 'close_date', 'photo']


class BiddingSerializer(serializers.ModelSerializer):

    def validate_item(self, item):
        user = self.context['request'].user

        lock.acquire()
        try:
            bidding = get_latest_bidding_with_user(item)
            if bidding is None:
                return item
            if bidding.profile.user == user:
                raise serializers.ValidationError("You already have the highest bid for this item.")
            if timezone.now() > item.close_date:
                raise serializers.ValidationError("Bidding is closed for this item.")
        finally:
            lock.release()

        return item

    def validate(self, data):
        item = data['item']
        bid = data['bid']

        lock.acquire()
        try:
            bidding = get_latest_bidding(item)
            if bidding is None:
                return data
            if bid <= bidding.bid:
                raise serializers.ValidationError({"bid": "Bid must be higher than the current one: {}."
                                                  .format(bidding.bid)})
        finally:
            lock.release()

        return data

    class Meta:
        model = Bidding
        fields = ('id', 'item', 'created_at', 'bid', 'auto_bid')

        # TODO: add lock for these validators
        validators = [
            UniqueTogetherValidator(
                queryset=Bidding.objects.all(),
                message='Bid must be higher than the current one.',
                fields=('item', 'bid')
            )
        ]