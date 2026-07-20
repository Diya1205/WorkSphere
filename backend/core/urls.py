from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import (
    AttendanceViewSet,
    AuthView,
    DepartmentViewSet,
    DesignationViewSet,
    EmployeeViewSet,
    LeaveViewSet,
    ProfileView,
    TaskViewSet,
    DashboardView,
)

router = DefaultRouter()

router.register("departments", DepartmentViewSet)
router.register("designations", DesignationViewSet)
router.register("employees", EmployeeViewSet)
router.register("attendance", AttendanceViewSet, basename="attendance")
router.register(r"tasks", TaskViewSet)
router.register(r"leaves", LeaveViewSet, basename="leaves")

urlpatterns = [
    path("auth/", AuthView.as_view(), name="auth"),
    path("", include(router.urls)),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("dashboard/", DashboardView.as_view(), name="dashboard"),
]