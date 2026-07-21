from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceViewSet,
    AuthView,
    DepartmentViewSet,
    DesignationViewSet,
    EmployeeViewSet,
    LeaveViewSet,
    MessageDetailView,
    NotificationViewSet,
    ProfileView,
    TaskViewSet,
    DashboardView,
    ConversationListCreateView,
    ConversationDetailView,
    ConversationMessagesView,
    MessageDetailView,
)

router = DefaultRouter()

router.register("departments", DepartmentViewSet)
router.register("designations", DesignationViewSet)
router.register("employees", EmployeeViewSet)
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register(r"tasks", TaskViewSet)
router.register(r"leaves", LeaveViewSet, basename="leaves")
router.register(
    r"notifications",
    NotificationViewSet,
    basename="notifications",
)
urlpatterns = [
    path("auth/", AuthView.as_view(), name="auth"),
    path("", include(router.urls)),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
    path(
        "messages/conversations/",
        ConversationListCreateView.as_view(),
        name="conversation-list-create",
    ),
    
    path(
        "messages/conversations/<int:pk>/",
        ConversationDetailView.as_view(),
        name="conversation-detail",
    ),
    
    path(
        "messages/conversations/<int:pk>/messages/",
        ConversationMessagesView.as_view(),
        name="conversation-messages",
    ),
    
    path(
        "messages/<int:pk>/",
        MessageDetailView.as_view(),
        name="message-detail",
    ),
]

