from django.shortcuts import render

# Create your views here.
from rest_framework import generics, status
from rest_framework.response import Response
from .models import Note
from .serializers import NoteSerializer
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from services.transcription import transcribe_audio


class NoteListCreateView(generics.ListCreateAPIView):
    serializer_class = NoteSerializer

    def get_queryset(self):
        # CRITICAL: always filter by request.user — never expose other users' notes
        queryset = Note.objects.filter(user=self.request.user).select_related('category')
        category_id = self.request.query_params.get('category')
        if category_id:
            queryset = queryset.filter(category_id=category_id)
        return queryset

    def perform_create(self, serializer):
        # Automatically attach the logged-in user — frontend never sends user ID
        serializer.save(user=self.request.user)


class NoteDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = NoteSerializer
    http_method_names = ['get', 'patch', 'delete']  # no PUT, only PATCH

    def get_queryset(self):
        # Same user-scoping — can't access another user's note even with correct UUID
        return Note.objects.filter(user=self.request.user).select_related('category')
    
    
class TranscribeAudioView(APIView):
    """
    Receives an audio file, returns transcribed text.
    Audio is never stored — stateless by design.
    """
    parser_classes = [MultiPartParser]

    def post(self, request):
        audio_file = request.FILES.get('audio')

        if not audio_file:
            return Response(
                {'error': 'No audio file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Basic size guard — prevent abuse
        max_size_mb = 25
        if audio_file.size > max_size_mb * 1024 * 1024:
            return Response(
                {'error': f'File too large. Maximum size is {max_size_mb}MB'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            text = transcribe_audio(audio_file)
            return Response({'text': text})
        except Exception as e:
            return Response(
                {'error': 'Transcription failed. Please try again.'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
    
    