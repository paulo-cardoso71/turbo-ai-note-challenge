from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from drf_spectacular.utils import extend_schema, OpenApiResponse

User = get_user_model()


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@extend_schema(
    summary="Register a new user",
    description="Creates a new user account and returns JWT tokens.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'example': 'user@example.com'},
                'password': {'type': 'string', 'example': 'securepassword123'},
            },
            'required': ['email', 'password'],
        }
    },
    responses={
        201: OpenApiResponse(description='User created, tokens returned'),
        400: OpenApiResponse(description='Validation error or email already registered'),
    },
    tags=['Authentication'],
    auth=[],
)
@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    if not email or not password:
        return Response(
            {'error': 'Email and password are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if User.objects.filter(email=email).exists():
        return Response(
            {'error': 'Email already registered'},
            status=status.HTTP_400_BAD_REQUEST
        )

    user = User.objects.create_user(email=email, password=password)
    tokens = get_tokens_for_user(user)

    return Response(
        {'email': user.email, 'tokens': tokens},
        status=status.HTTP_201_CREATED
    )


@extend_schema(
    summary="Login with email and password",
    description="Authenticates a user and returns JWT access and refresh tokens.",
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'email': {'type': 'string', 'example': 'user@example.com'},
                'password': {'type': 'string', 'example': 'securepassword123'},
            },
            'required': ['email', 'password'],
        }
    },
    responses={
        200: OpenApiResponse(description='Login successful, tokens returned'),
        401: OpenApiResponse(description='Invalid credentials'),
    },
    tags=['Authentication'],
    auth=[],
)
@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get('email', '').strip().lower()
    password = request.data.get('password', '')

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if not user.check_password(password):
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    tokens = get_tokens_for_user(user)
    return Response({'email': user.email, 'tokens': tokens})