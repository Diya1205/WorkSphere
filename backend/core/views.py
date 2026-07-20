from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework import serializers
from django.utils import timezone
from .models import (
    Attendance,
    Department,
    Designation,
    Employee,
    Task,
    Leave,
)
from .serializers import (
    AttendanceSerializer,
    DepartmentSerializer,
    DesignationSerializer,
    EmployeeSerializer,
    LoginSerializer,
    TaskSerializer,
    ProfileSerializer,
    LeaveSerializer, 
    LeaveDecisionSerializer
)
from django.conf import settings
from geopy.distance import geodesic


def _validate_office_geofence(latitude, longitude):
    """
    Phase 1: single hardcoded office (see settings.OFFICE_LATITUDE/LONGITUDE/RADIUS_METERS).
    Phase 2: swap this lookup for a per-employee Office model —
    the function signature and call sites in the view stay unchanged.
    """
    office = (settings.OFFICE_LATITUDE, settings.OFFICE_LONGITUDE)
    employee_location = (latitude, longitude)

    distance = geodesic(office, employee_location).meters

    return distance <= settings.OFFICE_RADIUS_METERS


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]


class DesignationViewSet(viewsets.ModelViewSet):
    queryset = Designation.objects.all()
    serializer_class = DesignationSerializer
    permission_classes = [AllowAny]


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.select_related(
        "department",
        "designation",
    )
    serializer_class = EmployeeSerializer
    permission_classes = [AllowAny]
    parser_classes = [MultiPartParser, FormParser]


class AuthView(APIView):
    def get_permissions(self):
        if self.request.method == "POST":
            return [AllowAny()]

        return [IsAuthenticated()]
    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = serializer.validated_data["user"]

        refresh = RefreshToken.for_user(user)

        return Response(
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
                "user": {
                    "id": user.id,
                    "employee_id": user.employee.id if hasattr(user, "employee") else None,
                    "username": user.username,
                    "email": user.email,
                    "full_name": user.get_full_name() or user.username,
                    "role": user.employee.role if hasattr(user, "employee") else "ADMIN",
                },
            },
            status=status.HTTP_200_OK,
        )

    def get(self, request):
        print("USER:", request.user)
        print("AUTH:", request.auth)
    
        if not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )
    
        user = request.user
    
        return Response(
            {
                "id": user.id,
                "employee_id": user.employee.id if hasattr(user, "employee") else None,
                "username": user.username,
                "email": user.email,
                "full_name": user.get_full_name() or user.username,
                "role": user.employee.role if hasattr(user, "employee") else "ADMIN",
            }
        )
    
class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Attendance.objects.select_related(
            "employee",
            "employee__department",
            "employee__designation",
        )

        if self.request.user.is_superuser:
            return queryset

        return queryset.filter(
            employee=self.request.user.employee
        )

    def create(self, request, *args, **kwargs):
        if request.user.is_superuser:
            return Response(
                {"detail": "Administrators cannot mark attendance."},
                status=status.HTTP_403_FORBIDDEN,
            )

        latitude = request.data.get("latitude")
        longitude = request.data.get("longitude")

        if latitude is None or longitude is None:
            return Response(
                {"detail": "Location is required to mark attendance."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            latitude = float(latitude)
            longitude = float(longitude)
        except (TypeError, ValueError):
            return Response(
                {"detail": "Invalid location data."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not _validate_office_geofence(latitude, longitude):
            return Response(
                {"detail": "You are outside the office premises."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        employee = request.user.employee
        today = timezone.localdate()
        location_str = f"{latitude},{longitude}"

        attendance = Attendance.objects.filter(
            employee=employee,
            date=today,
        ).first()

        # Check In
        if attendance is None:
            check_in_time = timezone.localtime(timezone.now())

            attendance = Attendance.objects.create(
                employee=employee,
                date=today,
                check_in=check_in_time,
                status="PRESENT",
                location=location_str,
            )

        # Check Out
        elif attendance.check_out is None:
            attendance.check_out = timezone.localtime(timezone.now())
            attendance.working_hours = (
                attendance.check_out - attendance.check_in
            )
            attendance.location = location_str

            attendance.save(
                update_fields=["check_out", "working_hours", "location"]
            )

        else:
            raise serializers.ValidationError(
                "Attendance already completed for today."
            )

        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=status.HTTP_200_OK)   
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.select_related(
        "assigned_to",
        "assigned_by",
    )

    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Task.objects.select_related(
            "assigned_to",
            "assigned_by",
        )

        user = self.request.user

        # Django Superuser
        if user.is_superuser:
            return queryset

        # HRMS Admin
        if hasattr(user, "employee") and user.employee.role == "ADMIN":
            return queryset

        # Employee -> Only own tasks
        return queryset.filter(
            assigned_to=user.employee
        )

    def create(self, request, *args, **kwargs):

        user = request.user

        if not (
            user.is_superuser
            or (
                hasattr(user, "employee")
                and user.employee.role == "ADMIN"
            )
        ):
            return Response(
                {
                    "detail": "Only admins can assign tasks."
                },
                status=status.HTTP_403_FORBIDDEN,
            )

        print("\n====================")
        print("REQUEST DATA")
        print(request.data)
        print("====================\n")

        serializer = self.get_serializer(data=request.data)

        if not serializer.is_valid():
            print("\n====================")
            print("SERIALIZER ERRORS")
            print(serializer.errors)
            print("====================\n")

            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(
            assigned_by=request.user,
        )

        return Response(
            serializer.data,
            status=status.HTTP_201_CREATED,
        )

    def perform_create(self, serializer):
        serializer.save(
            assigned_by=self.request.user
        )
    
    
    @action(detail=True, methods=["patch"])
    def update_status(self, request, pk=None):
    
        task = self.get_object()
        user = request.user
    
        # Only the assigned employee can update the task status
        if (
            not user.is_superuser
            and hasattr(user, "employee")
            and task.assigned_to != user.employee
        ):
            return Response(
                {
                    "detail": "You cannot update this task."
                },
                status=status.HTTP_403_FORBIDDEN,
            )
    
        serializer = self.get_serializer(
            task,
            data=request.data,
            partial=True,
        )
        
        serializer.is_valid(raise_exception=True)
        
        updated_task = serializer.save()
        
        if updated_task.status == "COMPLETED":
            updated_task.completed_at = timezone.now()
        else:
            updated_task.completed_at = None
        
        updated_task.save(update_fields=["completed_at"])
        
        return Response(self.get_serializer(updated_task).data)
    

class ProfileView(APIView):
    """
    GET  -> returns the logged-in employee's own profile
    PATCH -> updates the logged-in employee's own profile

    Never exposes or accepts an employee id from the client —
    the employee is always resolved from request.user.
    """
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_object(self, request):
        if not hasattr(request.user, "employee"):
            return None
        return request.user.employee

    def get(self, request):
        employee = self.get_object(request)
        if employee is None:
            return Response(
                {"detail": "No employee profile linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ProfileSerializer(employee, context={"request": request})
        return Response(serializer.data)

    def patch(self, request):
        employee = self.get_object(request)
        if employee is None:
            return Response(
                {"detail": "No employee profile linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = ProfileSerializer(
            employee,
            data=request.data,
            partial=True,
            context={"request": request},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)



from django.db.models import Count, Q

class DashboardView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        is_admin = user.is_superuser or (
            hasattr(user, "employee") and user.employee.role == "ADMIN"
        )

        if is_admin:
            return Response(self._admin_payload())

        if not hasattr(user, "employee"):
            return Response(
                {"detail": "No employee profile linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response(self._employee_payload(user.employee))

    def _admin_payload(self):
        today = timezone.localdate()

        employees = Employee.objects.select_related("department", "designation")
        total_employees = employees.count()
        active_employees = employees.filter(status="ACTIVE").count()

        dept_headcount = list(
            employees.values("department__name")
            .annotate(count=Count("id"))
            .order_by("-count")
        )

        present_today = Attendance.objects.filter(date=today, status="PRESENT").count()
        absent_today = max(active_employees - present_today, 0)

        tasks = Task.objects.all()
        pending_tasks = tasks.filter(status__in=["TODO", "IN_PROGRESS"]).count()
        completed_tasks = tasks.filter(status="COMPLETED").count()

        tasks_by_assignee = list(
            tasks.values(
                "assigned_to__id", "assigned_to__first_name", "assigned_to__last_name"
            )
            .annotate(
                pending=Count("id", filter=Q(status="TODO")),
                in_progress=Count("id", filter=Q(status="IN_PROGRESS")),
                completed=Count("id", filter=Q(status="COMPLETED")),
            )
            .order_by("-pending")[:8]
        )

        recent_employees = list(
            employees.order_by("-created_at")[:5].values(
                "id", "employee_code", "first_name", "last_name",
                "department__name", "created_at",
            )
        )

        recent_tasks = list(
            tasks.select_related("assigned_to").order_by("-created_at")[:5].values(
                "id", "task_code", "title", "status", "priority",
                "assigned_to__first_name", "assigned_to__last_name", "due_date",
            )
        )

        return {
            "role": "ADMIN",
            "stats": {
                "total_employees": total_employees,
                "active_employees": active_employees,
                "departments": Department.objects.filter(is_active=True).count(),
                "present_today": present_today,
                "absent_today": absent_today,
                "pending_tasks": pending_tasks,
                "completed_tasks": completed_tasks,
            },
            "department_headcount": dept_headcount,
            "tasks_by_assignee": tasks_by_assignee,
            "recent_employees": recent_employees,
            "recent_tasks": recent_tasks,
        }

    def _employee_payload(self, employee):
        today = timezone.localdate()

        my_tasks = Task.objects.filter(assigned_to=employee)
        attendance = Attendance.objects.filter(employee=employee, date=today).first()

        return {
            "role": "EMPLOYEE",
            "stats": {
                "my_tasks": my_tasks.count(),
                "pending_tasks": my_tasks.filter(status__in=["TODO", "IN_PROGRESS"]).count(),
                "completed_tasks": my_tasks.filter(status="COMPLETED").count(),
                "attendance_status": attendance.status if attendance else None,
                "check_in": attendance.check_in if attendance else None,
                "check_out": attendance.check_out if attendance else None,
            },
            "recent_tasks": list(
                my_tasks.order_by("-created_at")[:5].values(
                    "id", "task_code", "title", "status", "priority", "due_date"
                )
            ),
        }
    


def _is_admin(user):
    return user.is_superuser or (
        hasattr(user, "employee") and user.employee.role == "ADMIN"
    )


class LeaveViewSet(viewsets.ModelViewSet):
    serializer_class = LeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = Leave.objects.select_related(
            "employee",
            "employee__department",
            "employee__designation",
            "approved_by",
        )

        if _is_admin(self.request.user):
            return queryset

        return queryset.filter(employee=self.request.user.employee)

    def create(self, request, *args, **kwargs):
        if not hasattr(request.user, "employee"):
            return Response(
                {"detail": "No employee profile linked to this account."},
                status=status.HTTP_404_NOT_FOUND,
            )

        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        employee = request.user.employee
        start_date = serializer.validated_data["start_date"]
        end_date = serializer.validated_data["end_date"]

        overlap_exists = Leave.objects.filter(
            employee=employee,
            status__in=["PENDING", "APPROVED"],
            start_date__lte=end_date,
            end_date__gte=start_date,
        ).exists()

        if overlap_exists:
            return Response(
                {"detail": "You already have a leave request overlapping these dates."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer.save(employee=employee, status="PENDING")

        return Response(serializer.data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        leave = self.get_object()

        is_owner = (
            hasattr(request.user, "employee")
            and leave.employee == request.user.employee
        )

        if not is_owner:
            return Response(
                {"detail": "You cannot edit another employee's leave request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if leave.status != "PENDING":
            return Response(
                {"detail": "Only pending leave requests can be edited."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        leave = self.get_object()

        is_owner = (
            hasattr(request.user, "employee")
            and leave.employee == request.user.employee
        )

        if not is_owner:
            return Response(
                {"detail": "You cannot delete another employee's leave request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if leave.status != "PENDING":
            return Response(
                {"detail": "Only pending leave requests can be deleted."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return super().destroy(request, *args, **kwargs)

    def _decide(self, request, new_status):
        if not _is_admin(request.user):
            return Response(
                {"detail": "Only admins can perform this action."},
                status=status.HTTP_403_FORBIDDEN,
            )

        leave = self.get_object()

        if leave.status != "PENDING":
            return Response(
                {"detail": "Only pending leave requests can be decided."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        decision_serializer = LeaveDecisionSerializer(data=request.data)
        decision_serializer.is_valid(raise_exception=True)

        leave.status = new_status
        leave.approved_by = request.user
        leave.approved_at = timezone.now()
        leave.admin_remarks = decision_serializer.validated_data.get("admin_remarks", "")
        leave.save(update_fields=["status", "approved_by", "approved_at", "admin_remarks"])

        return Response(self.get_serializer(leave).data)

    @action(detail=True, methods=["post"])
    def approve(self, request, pk=None):
        return self._decide(request, "APPROVED")

    @action(detail=True, methods=["post"])
    def reject(self, request, pk=None):
        return self._decide(request, "REJECTED")

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        leave = self.get_object()

        is_owner = (
            hasattr(request.user, "employee")
            and leave.employee == request.user.employee
        )

        if not (is_owner or _is_admin(request.user)):
            return Response(
                {"detail": "You cannot cancel this leave request."},
                status=status.HTTP_403_FORBIDDEN,
            )

        if leave.status not in ["PENDING", "APPROVED"]:
            return Response(
                {"detail": "Only pending or approved leave requests can be cancelled."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        leave.status = "CANCELLED"
        update_fields = ["status"]

        if _is_admin(request.user):
            leave.approved_by = request.user
            leave.approved_at = timezone.now()
            update_fields += ["approved_by", "approved_at"]

        leave.save(update_fields=update_fields)

        return Response(self.get_serializer(leave).data)