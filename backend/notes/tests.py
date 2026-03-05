from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Note
from categories.models import Category

User = get_user_model()


class NotesCRUDTests(TestCase):
    """
    Tests for notes CRUD operations.
    Focus: user isolation — a user must never see another user's notes.
    This is the most critical security property of the app.
    """

    def setUp(self):
        self.client = APIClient()
        self.notes_url = '/api/notes/'

        # Create two users to test isolation
        self.user_a = User.objects.create_user(
            email='usera@test.com',
            password='pass123'
        )
        self.user_b = User.objects.create_user(
            email='userb@test.com',
            password='pass123'
        )

        # Create a category for testing
        self.category = Category.objects.create(
            name='Test Category',
            color='#E8A87C'
        )

    def _auth(self, user):
        """Helper: authenticate the client as a specific user."""
        self.client.force_authenticate(user=user)

    def test_unauthenticated_request_returns_401(self):
        """
        No token = no access. Full stop.
        """
        self.client.force_authenticate(user=None)
        response = self.client.get(self.notes_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_can_create_note(self):
        """
        Authenticated user can create a note.
        The note is automatically assigned to them.
        """
        self._auth(self.user_a)
        response = self.client.post(self.notes_url, {
            'title': 'My First Note',
            'content': 'Some content here',
            'category': self.category.id,
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['title'], 'My First Note')

        # Verify it's in the database and owned by user_a
        note = Note.objects.get(id=response.data['id'])
        self.assertEqual(note.user, self.user_a)

    def test_user_only_sees_own_notes(self):
        """
        CRITICAL SECURITY TEST.
        User A must never see User B's notes.
        """
        # Create a note for user_a
        Note.objects.create(
            user=self.user_a,
            title='User A Note',
            content='Private content'
        )

        # Create a note for user_b
        Note.objects.create(
            user=self.user_b,
            title='User B Note',
            content='Also private'
        )

        # User A requests their notes
        self._auth(self.user_a)
        response = self.client.get(self.notes_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'User A Note')

    def test_user_cannot_access_another_users_note_by_id(self):
        """
        CRITICAL SECURITY TEST.
        User B must not be able to access User A's note
        even if they know the UUID.
        """
        note = Note.objects.create(
            user=self.user_a,
            title='Secret Note',
            content='Top secret'
        )

        # User B tries to access User A's note directly
        self._auth(self.user_b)
        response = self.client.get(f'{self.notes_url}{note.id}/')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_user_can_update_own_note(self):
        """User can edit their own note via PATCH."""
        note = Note.objects.create(
            user=self.user_a,
            title='Original Title',
            content='Original content'
        )

        self._auth(self.user_a)
        response = self.client.patch(
            f'{self.notes_url}{note.id}/',
            {'title': 'Updated Title'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Updated Title')

    def test_user_cannot_update_another_users_note(self):
        """User B cannot modify User A's note."""
        note = Note.objects.create(
            user=self.user_a,
            title='User A Note',
            content='Content'
        )

        self._auth(self.user_b)
        response = self.client.patch(
            f'{self.notes_url}{note.id}/',
            {'title': 'Hacked Title'},
            format='json'
        )

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

        # Verify the note was NOT modified
        note.refresh_from_db()
        self.assertEqual(note.title, 'User A Note')

    def test_user_can_delete_own_note(self):
        """User can delete their own note."""
        note = Note.objects.create(
            user=self.user_a,
            title='To Delete',
            content='Content'
        )

        self._auth(self.user_a)
        response = self.client.delete(f'{self.notes_url}{note.id}/')

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Note.objects.filter(id=note.id).exists())

    def test_filter_notes_by_category(self):
        """
        Category filter must return only notes
        belonging to that category.
        """
        other_category = Category.objects.create(
            name='Other',
            color='#83C5BE'
        )

        Note.objects.create(
            user=self.user_a,
            title='Category Note',
            category=self.category
        )
        Note.objects.create(
            user=self.user_a,
            title='Other Category Note',
            category=other_category
        )

        self._auth(self.user_a)
        response = self.client.get(
            f'{self.notes_url}?category={self.category.id}'
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['title'], 'Category Note')