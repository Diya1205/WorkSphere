from django.contrib.auth.models import User

from .models import Notification


def create_notification(
    *,
    recipient: User | None,
    title: str,
    message: str,
    notification_type: str = Notification.NotificationType.GENERAL,
    reference=None,
    action_url: str | None = None,
):
    """
    Central place to create notifications.
    Every module should call this function instead of
    Notification.objects.create().
    """

    if recipient is None:
        return None

    return Notification.objects.create(
        recipient=recipient,
        title=title,
        message=message,
        notification_type=notification_type,
        reference_type=(
            reference.__class__.__name__.upper()
            if reference is not None
            else None
        ),
        reference_id=getattr(reference, "pk", None),
        action_url=action_url,
    )


def notify_many(
    *,
    recipients,
    title,
    message,
    notification_type=Notification.NotificationType.GENERAL,
    reference=None,
    action_url: str | None = None,
):
    """
    Create the same notification for multiple users.
    Example:
    - Notify all admins
    - Notify everyone in a conversation
    """

    notifications = []

    for recipient in recipients:
        notification = create_notification(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            reference=reference,
            action_url=action_url,
        )

        if notification:
            notifications.append(notification)

    return notifications