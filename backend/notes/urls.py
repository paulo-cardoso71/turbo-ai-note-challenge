from django.urls import path
from .views import NoteListCreateView, NoteDetailView, TranscribeAudioView

urlpatterns = [
    path('', NoteListCreateView.as_view(), name='note-list-create'),
    path('<uuid:pk>/', NoteDetailView.as_view(), name='note-detail'),
    path('transcribe/', TranscribeAudioView.as_view(), name='transcribe-audio'),
]