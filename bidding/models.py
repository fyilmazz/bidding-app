from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver


class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    max_bid_amount = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.user.username


@receiver(post_save, sender=User)
def create_user(sender, instance, created, **kwargs):
    if created:
        Profile.objects.get_or_create(user=instance)


class Item(models.Model):
    name = models.CharField(max_length=50)
    description = models.TextField()
    close_date = models.DateTimeField()
    photo = models.ImageField(upload_to='items')

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class Bidding(models.Model):
    profile = models.ForeignKey(Profile, on_delete=models.SET_NULL, null=True)
    item = models.ForeignKey(Item, on_delete=models.SET_NULL, null=True)
    bid = models.PositiveIntegerField()
    auto_bid = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('item', 'bid')

    def __str__(self):
        return "{} - {} - {}".format(self.profile, self.item, self.bid)
