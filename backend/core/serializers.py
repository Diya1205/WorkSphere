from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from .models import (
    Attendance,
    Department,
    Designation,
    Employee,
    Task,
)


class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = "__all__"


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(
        source="department.name",
        read_only=True,
    )

    designation_name = serializers.CharField(
        source="designation.name",
        read_only=True,
    )

    class Meta:
        model = Employee
        fields = "__all__"

        read_only_fields = (
            "user",
            "employee_code",
            "created_at",
            "updated_at",
        )

    @transaction.atomic
    def create(self, validated_data):

        email = validated_data["email"]

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError(
                {
                    "email": "Email already exists."
                }
            )

        user = User.objects.create_user(
            username=email,
            email=email,
            password="Welcome@123",
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )

        employee = Employee.objects.create(
            user=user,
            **validated_data,
        )

        return employee

class AttendanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    employee_code = serializers.CharField(
        source="employee.employee_code",
        read_only=True,
    )
    working_hours_display = serializers.SerializerMethodField()

    # GPS input only — used for geofence validation in the view,
    # never stored as raw model fields, never echoed back to the client.
    latitude = serializers.FloatField(write_only=True, required=False)
    longitude = serializers.FloatField(write_only=True, required=False)

    class Meta:
        model = Attendance
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_code",
            "date",
            "check_in",
            "check_out",
            "location",
            "status",
            "working_hours",
            "working_hours_display",
            "created_at",
            "updated_at",
            "latitude",
            "longitude",
        ]
        read_only_fields = (
            "employee",
            "date",
            "check_in",
            "check_out",
            "created_at",
            "updated_at",
        )
    
    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_working_hours_display(self, obj):
        if not obj.working_hours:
            return None

        total_seconds = int(obj.working_hours.total_seconds())
        hours = total_seconds // 3600
        minutes = (total_seconds % 3600) // 60

        return f"{hours}h {minutes}m"

class TaskSerializer(serializers.ModelSerializer):

    assigned_date = serializers.DateTimeField(
        source="created_at",
        read_only=True,
    )

    assigned_to_name = serializers.SerializerMethodField()

    assigned_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = "__all__"

        read_only_fields = (
            "task_code",
            "assigned_by",
            "created_at",
            "updated_at",
        )

    def get_assigned_to_name(self, obj):
        return (
            f"{obj.assigned_to.first_name} "
            f"{obj.assigned_to.last_name}"
        )

    def get_assigned_by_name(self, obj):
        if obj.assigned_by:
            return obj.assigned_by.get_full_name() or obj.assigned_by.username
        return None

class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        user = authenticate(
            username=user.username,
            password=password,
        )

        if user is None:
            raise serializers.ValidationError(
                "Invalid email or password."
            )

        attrs["user"] = user
        return attrs
    

class ProfileSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    designation_name = serializers.CharField(source="designation.name", read_only=True)
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = [
            "id",
            "employee_code",
            "first_name",
            "last_name",
            "full_name",
            "email",
            "phone",
            "emergency_contact",
            "profile_photo",
            "gender",
            "marital_status",
            "date_of_birth",
            "joining_date",
            "department",
            "department_name",
            "designation",
            "designation_name",
            "annual_ctc",
            "address",
            "city",
            "state",
            "country",
            "status",
            "role",
        ]
        read_only_fields = (
            "id",
            "employee_code",
            "first_name",
            "last_name",
            "email",
            "gender",
            "date_of_birth",
            "joining_date",
            "department",
            "department_name",
            "designation",
            "designation_name",
            "annual_ctc",
            "status",
            "role",
        )

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"
    