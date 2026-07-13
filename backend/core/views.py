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
)
from .serializers import (
    AttendanceSerializer,
    DepartmentSerializer,
    DesignationSerializer,
    EmployeeSerializer,
    LoginSerializer,
    TaskSerializer,
    ProfileSerializer,
)


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
                {
                    "detail": "Administrators cannot mark attendance."
                },
                status=status.HTTP_403_FORBIDDEN,
            )
        employee = request.user.employee
        today = timezone.localdate()
    
        attendance = Attendance.objects.filter(
            employee=employee,
            date=today,
        ).first()
    
        # Check In
        if attendance is None:
            check_in_time = timezone.localtime(timezone.now())

            office_start = check_in_time.replace(
                hour=10,
                minute=15,
                second=0,
                microsecond=0,
            )

            attendance_status = "PRESENT"
            attendance = Attendance.objects.create(
                employee=employee,
                date=today,
                check_in=check_in_time,
                status=attendance_status,
            )
    
        # Check Out
        elif attendance.check_out is None:
            attendance.check_out = timezone.localtime(timezone.now())

            attendance.working_hours = (
                attendance.check_out - attendance.check_in
            )

            attendance.save(
                update_fields=[
                    "check_out",
                    "working_hours",
                ]
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