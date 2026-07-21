from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
import re
from .models import (
    Attendance,
    Department,
    Designation,
    Employee,
    Task,
    Leave,
    Conversation,          
    ConversationParticipant,  
    Message,
)


class DepartmentSerializer(serializers.ModelSerializer):
    # Populated by the view's annotate(); never trust a client-sent value.
    employee_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Department
        fields = [
            "id",
            "name",
            "description",
            "is_active",
            "employee_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_at", "updated_at")

    @staticmethod
    def _generate_code(name):
        base = re.sub(r"[^A-Za-z0-9]+", "_", name).strip("_").upper()[:16] or "DEPT"
        code = base
        suffix = 1
        while Department.objects.filter(code=code).exists():
            suffix += 1
            code = f"{base}_{suffix}"[:20]
        return code

    def create(self, validated_data):
        validated_data["code"] = self._generate_code(validated_data["name"])
        return super().create(validated_data)


class DesignationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Designation
        fields = "__all__"


class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.CharField(source="department.name", read_only=True)
    designation_name = serializers.CharField(source="designation.name", read_only=True)

    class Meta:
        model = Employee
        fields = "__all__"
        read_only_fields = ("user", "employee_code", "created_at", "updated_at")

    def validate(self, attrs):
        role = attrs.get("role", getattr(self.instance, "role", "EMPLOYEE"))
        is_employee_role = role not in Employee.NON_EMPLOYEE_ROLES
        today = timezone.localdate()

        if is_employee_role:
            # Employee-track roles require these fields.
            errors = {}
            for field in ("department", "designation", "joining_date"):
                value = attrs.get(field, getattr(self.instance, field, None))
                if not value:
                    errors[field] = "This field is required."
            if errors:
                raise serializers.ValidationError(errors)

            joining_date = attrs.get("joining_date")
            if joining_date and joining_date > today:
                raise serializers.ValidationError(
                    {"joining_date": "Joining date cannot be in the future."}
                )
        else:
            # Admins: strip employee-only fields so nothing leaks through,
            # even if the client sent them.
            for field in ("department", "designation", "joining_date", "annual_ctc"):
                attrs.pop(field, None)

        dob = attrs.get("date_of_birth", getattr(self.instance, "date_of_birth", None))
        if dob:
            if dob > today:
                raise serializers.ValidationError(
                    {"date_of_birth": "Date of birth cannot be in the future."}
                )
            age = today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
            if age < 18:
                raise serializers.ValidationError(
                    {"date_of_birth": "Employee must be at least 18 years old."}
                )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        email = validated_data["email"]

        if User.objects.filter(email=email).exists():
            raise serializers.ValidationError({"email": "Email already exists."})

        default_password = (
            "Admin@123"
            if validated_data["role"] in Employee.NON_EMPLOYEE_ROLES
            else "Welcome@123"
        )
        
        user = User.objects.create_user(
            username=email,
            email=email,
            password=default_password,
            first_name=validated_data["first_name"],
            last_name=validated_data["last_name"],
        )

        employee = Employee.objects.create(user=user, **validated_data)
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




class LeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    approved_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Leave
        fields = [
            "id",
            "employee",
            "employee_name",
            "employee_code",
            "leave_type",
            "start_date",
            "end_date",
            "days",
            "reason",
            "status",
            "applied_at",
            "approved_by",
            "approved_by_name",
            "approved_at",
            "admin_remarks",
            "updated_at",
        ]
        read_only_fields = (
            "employee",
            "days",
            "status",
            "applied_at",
            "approved_by",
            "approved_at",
            "admin_remarks",
            "updated_at",
        )

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

    def get_approved_by_name(self, obj):
        if obj.approved_by:
            return obj.approved_by.get_full_name() or obj.approved_by.username
        return None

    def validate(self, attrs):
        start = attrs.get("start_date", getattr(self.instance, "start_date", None))
        end = attrs.get("end_date", getattr(self.instance, "end_date", None))

        today = timezone.localdate()

        if start and start < today:
            raise serializers.ValidationError(
                {
                    "start_date": "You cannot apply leave for past dates."
                }
            )

        if start and end and start > end:
            raise serializers.ValidationError(
                {
                    "end_date": "End date cannot be before start date."
                }
            )

        return attrs


class LeaveDecisionSerializer(serializers.Serializer):
    """Used for approve/reject — admin_remarks is optional in both cases."""
    admin_remarks = serializers.CharField(required=False, allow_blank=True)




class ParticipantSerializer(serializers.ModelSerializer):
    """Lightweight employee summary used inside conversation payloads."""

    employee_id = serializers.IntegerField(source="employee.id", read_only=True)
    full_name = serializers.SerializerMethodField()
    role = serializers.CharField(source="employee.role", read_only=True)
    employee_code = serializers.CharField(source="employee.employee_code", read_only=True)
    profile_photo = serializers.ImageField(source="employee.profile_photo", read_only=True)

    class Meta:
        model = ConversationParticipant
        fields = [
            "employee_id",
            "full_name",
            "role",
            "employee_code",
            "profile_photo",
            "joined_at",
        ]

    def get_full_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"


class MessageSerializer(serializers.ModelSerializer):
    sender_id = serializers.IntegerField(source="sender.id", read_only=True)
    sender_name = serializers.SerializerMethodField()
    sender_profile_photo = serializers.ImageField(
        source="sender.profile_photo", read_only=True
    )
    is_edited = serializers.SerializerMethodField()

    class Meta:
        model = Message
        fields = [
            "id",
            "conversation",
            "sender_id",
            "sender_name",
            "sender_profile_photo",
            "message",
            "is_edited",
            "is_deleted",
            "created_at",
            "updated_at",
            "edited_at",
        ]
        read_only_fields = (
            "conversation",
            "created_at",
            "updated_at",
            "edited_at",
            "is_deleted",
        )

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}"

    def get_is_edited(self, obj):
        return obj.edited_at is not None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_deleted:
            data["message"] = "This message was deleted."
        return data


class ConversationSerializer(serializers.ModelSerializer):
    """Used for conversation list + detail."""

    participants = ParticipantSerializer(many=True, read_only=True)
    display_name = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = [
            "id",
            "conversation_type",
            "name",
            "display_name",
            "participants",
            "last_message",
            "unread_count",
            "created_by",
            "created_by_name",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("created_by", "created_at", "updated_at")

    def get_created_by_name(self, obj):
        if obj.created_by:
            return f"{obj.created_by.first_name} {obj.created_by.last_name}"
        return None

    def get_display_name(self, obj):
        request = self.context.get("request")
        current_employee = getattr(request.user, "employee", None) if request else None

        if obj.conversation_type == "EVERYONE":
            return obj.name or "Everyone"

        if obj.conversation_type == "GROUP":
            return obj.name or ", ".join(
                f"{p.employee.first_name}" for p in obj.participants.all()[:4]
            )

        # DIRECT — show the other participant's name
        if current_employee:
            other = next(
                (p for p in obj.participants.all() if p.employee_id != current_employee.id),
                None,
            )
            if other:
                return f"{other.employee.first_name} {other.employee.last_name}"

        return obj.name or "Conversation"

    def get_last_message(self, obj):
        last = obj.messages.order_by("-created_at").first()
        if not last:
            return None
        return {
            "id": last.id,
            "message": "This message was deleted." if last.is_deleted else last.message,
            "sender_id": last.sender_id,
            "sender_name": f"{last.sender.first_name} {last.sender.last_name}",
            "created_at": last.created_at,
        }

    def get_unread_count(self, obj):
        request = self.context.get("request")
        current_employee = getattr(request.user, "employee", None) if request else None
        if not current_employee:
            return 0

        membership = next(
            (p for p in obj.participants.all() if p.employee_id == current_employee.id),
            None,
        )
        if not membership:
            return 0

        qs = obj.messages.filter(is_deleted=False).exclude(sender=current_employee)
        if membership.last_read_at:
            qs = qs.filter(created_at__gt=membership.last_read_at)
        return qs.count()


class ConversationCreateSerializer(serializers.Serializer):
    """
    Handles all three creation payloads:
      - Individual: {"conversation_type": "DIRECT", "receiver": <employee_id>}
      - Group:      {"conversation_type": "GROUP", "participants": [<id>, <id>, ...], "name": "optional"}
      - Everyone:   {"conversation_type": "EVERYONE"}
    """

    conversation_type = serializers.ChoiceField(choices=Conversation.TYPE_CHOICES)
    receiver = serializers.IntegerField(required=False)
    participants = serializers.ListField(
        child=serializers.IntegerField(), required=False
    )
    name = serializers.CharField(required=False, allow_blank=True)

    def validate(self, attrs):
        conv_type = attrs["conversation_type"]

        if conv_type == "DIRECT" and not attrs.get("receiver"):
            raise serializers.ValidationError(
                {"receiver": "receiver is required for a direct conversation."}
            )

        if conv_type == "GROUP":
            participants = attrs.get("participants") or []
            if len(participants) < 2:
                raise serializers.ValidationError(
                    {"participants": "A group needs at least 2 other participants."}
                )

        return attrs