from django.urls import path
from .views import NoteListCreateView, NoteDetailView, TranscribeAudioView, GenerateTitleView

urlpatterns = [
    path('', NoteListCreateView.as_view(), name='note-list-create'),
    path('transcribe/', TranscribeAudioView.as_view(), name='transcribe-audio'),
    path('generate-title/', GenerateTitleView.as_view(), name='generate-title'),
    path('<uuid:pk>/', NoteDetailView.as_view(), name='note-detail'),

]