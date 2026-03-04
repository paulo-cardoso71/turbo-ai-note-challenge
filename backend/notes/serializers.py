from rest_framework import serializers
from .models import Note
from categories.serializers import CategorySerializer


class NoteSerializer(serializers.ModelSerializer):
    category_detail = CategorySerializer(source='category', read_only=True)

    class Meta:
        model = Note
        fields = [
            'id', 'title', 'content',
            'category', 'category_detail',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']