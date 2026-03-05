from django.test import TestCase
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class AuthenticationTests(TestCase):
    """
    Tests for user registration and login.
    These are the foundation of the entire app
    if auth breaks, nothing else works.
    """

    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register/'
        self.login_url = '/api/auth/login/'

    def test_register_with_valid_credentials_returns_tokens(self):
        """
        A new user should be able to register with email + password
        and receive JWT access and refresh tokens.
        """
        response = self.client.post(self.register_url, {
            'email': 'newuser@test.com',
            'password': 'testpassword123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])
        self.assertIn('refresh', response.data['tokens'])
        self.assertEqual(response.data['email'], 'newuser@test.com')

    def test_register_with_duplicate_email_returns_400(self):
        """
        Registering with an already-used email should fail clearly.
        Silent failures here would be a security issue.
        """
        User.objects.create_user(email='existing@test.com', password='pass123')

        response = self.client.post(self.register_url, {
            'email': 'existing@test.com',
            'password': 'anotherpass123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_register_without_email_returns_400(self):
        """Incomplete registration data should be rejected."""
        response = self.client.post(self.register_url, {
            'password': 'testpassword123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_valid_credentials_returns_tokens(self):
        """
        Existing user should receive tokens on login.
        """
        User.objects.create_user(
            email='loginuser@test.com',
            password='testpassword123'
        )

        response = self.client.post(self.login_url, {
            'email': 'loginuser@test.com',
            'password': 'testpassword123',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('tokens', response.data)
        self.assertIn('access', response.data['tokens'])

    def test_login_with_wrong_password_returns_401(self):
        """
        Wrong password must return 401 — not 400, not 500.
        The error message must not reveal whether the email exists.
        """
        User.objects.create_user(
            email='user@test.com',
            password='correctpassword'
        )

        response = self.client.post(self.login_url, {
            'email': 'user@test.com',
            'password': 'wrongpassword',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Invalid credentials')

    def test_login_with_nonexistent_email_returns_401(self):
        """
        Non-existent email returns same error as wrong password.
        Prevents email enumeration attacks.
        """
        response = self.client.post(self.login_url, {
            'email': 'nobody@test.com',
            'password': 'anypassword',
        }, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        self.assertEqual(response.data['error'], 'Invalid credentials')