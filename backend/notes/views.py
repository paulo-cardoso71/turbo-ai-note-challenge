from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from drf_spectacular.utils import extend_schema, OpenApiResponse, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Note
from .serializers import NoteSerializer
from services.transcription import transcribe_audio


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer

    @extend_schema(
        summary="List notes for current user",
        description="Returns all notes belonging to the authenticated user. Optionally filter by category.",
        parameters=[
            OpenApiParameter(
                name='category',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Filter notes by category ID',
                required=False,
            )
        ],
        tags=['Notes'],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Create a new note",
        description="Creates a note owned by the authenticated user. Title and content are optional.",
        tags=['Notes'],
    )
    def post(self, request, *args, **kwargs):
        return super().post(request, *args, **kwargs)

    def get_queryset(self):
        # CRITICAL: always filter by request.user — never expose other users' notes
        queryset = Note.objects.filter(
            user=self.request.user
        ).select_related('category')
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        # Automatically attach the logged-in user — frontend never sends user ID
        serializer.save(user=self.request.user)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    http_method_names = ['get', 'patch', 'delete']

    @extend_schema(
        summary="Get a note by ID",
        tags=['Notes'],
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)

    @extend_schema(
        summary="Update a note (partial update)",
        description="Updates one or more fields of a note. All fields are optional.",
        tags=['Notes'],
    )
    def patch(self, request, *args, **kwargs):
        return super().patch(request, *args, **kwargs)

    @extend_schema(
        summary="Delete a note",
        tags=['Notes'],
    )
    def delete(self, request, *args, **kwargs):
        return super().delete(request, *args, **kwargs)

    def get_queryset(self):
        # Same user-scoping — can't access another user's note even with correct UUID
        return Note.objects.filter(
            user=self.request.user
        ).select_related('category')


class TranscribeAudioView(APIView):
    """
    Receives an audio file, returns transcribed text.
    Audio is never stored — stateless by design.
    """
    parser_classes = [MultiPartParser]

    @extend_schema(
        summary="Transcribe audio to text",
        description=(
            "Accepts an audio file (webm, mp3, wav, m4a) up to 25MB. "
            "Returns transcribed text via OpenAI Whisper. "
            "Audio is never stored — this endpoint is stateless by design."
        ),
        request={
            'multipart/form-data': {
                'type': 'object',
                'properties': {
                    'audio': {'type': 'string', 'format': 'binary'},
                },
                'required': ['audio'],
            }
        },
        responses={
            200: OpenApiResponse(description='Transcription successful — returns {text: string}'),
            400: OpenApiResponse(description='No file provided or file too large'),
            503: OpenApiResponse(description='Transcription service unavailable'),
        },
        tags=['AI Features'],
    )
    def post(self, request):
        audio_file = request.FILES.get('audio')

        if not audio_file:
            return Response(
                {'error': 'No audio file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        max_size_mb = 25
        if audio_file.size > max_size_mb * 1024 * 1024:
            return Response(
                {'error': f'File too large. Maximum size is {max_size_mb}MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            text = transcribe_audio(audio_file)
            return Response({'text': text})
        except Exception:
            return Response(
                {'error': 'Transcription failed. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )