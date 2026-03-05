from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status
from .models import Category

User = get_user_model()


class CategoryTests(TestCase):
    """
    Tests for category endpoints.
    Categories are global, read-only, and seeded via migration.
    """

    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            email='user@test.com',
            password='pass123'
        )
        self.client.force_authenticate(user=self.user)
        # No manual seeding here — the seed migration runs automatically
        # when Django creates the test database

    def test_authenticated_user_can_list_categories(self):
        """Categories endpoint returns all seeded categories."""
        response = self.client.get('/api/categories/')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 3)

    def test_categories_have_correct_fields(self):
        """Each category must have id, name, and color."""
        response = self.client.get('/api/categories/')

        category = response.data[0]
        self.assertIn('id', category)
        self.assertIn('name', category)
        self.assertIn('color', category)

    def test_unauthenticated_user_cannot_list_categories(self):
        """Categories require authentication."""
        self.client.force_authenticate(user=None)
        response = self.client.get('/api/categories/')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)