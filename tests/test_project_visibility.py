"""Project visibility: users see only their own projects; admin sees all."""

from __future__ import annotations

import os
import unittest

from webapp import create_app
from webapp.models import AccessRole, Project, User, db


class ProjectVisibilityTests(unittest.TestCase):
    def setUp(self) -> None:
        os.environ["UTS_ADMIN_USERNAME"] = "admin"
        os.environ["UTS_ADMIN_PASSWORD"] = "admin"
        os.environ["UTS_SYNC_ADMIN_PASSWORD"] = "true"
        os.environ["UTS_SIMPLE_PASSWORDS"] = "true"
        self.app = create_app(
            {
                "TESTING": True,
                "SQLALCHEMY_DATABASE_URI": "sqlite:///:memory:",
                "SECRET_KEY": "test-secret",
            }
        )
        self.client = self.app.test_client()

    def csrf(self) -> str:
        with self.client.session_transaction() as session:
            return session["csrf_token"]

    def login(self, username: str = "admin", password: str = "admin"):
        self.client.get("/login")
        return self.client.post(
            "/login",
            data={
                "username": username,
                "password": password,
                "_csrf_token": self.csrf(),
            },
        )

    def create_user(self, username: str, role_name: str = "Manager") -> None:
        self.login()
        with self.app.app_context():
            role = AccessRole.query.filter_by(name=role_name).one()
            role_id = role.id
        self.client.post(
            "/admin/users",
            data={
                "employee_name": username.title(),
                "username": username,
                "password": "Pass1234!",
                "role_id": role_id,
                "is_active": "on",
                "_csrf_token": self.csrf(),
            },
        )
        self.logout()

    def create_project(self, name: str, url: str = "https://example.com/app") -> int:
        response = self.client.post(
            "/projects",
            data={
                "name": name,
                "application_url": url,
                "_csrf_token": self.csrf(),
            },
        )
        self.assertEqual(response.status_code, 302)
        with self.app.app_context():
            project = Project.query.filter_by(name=name).order_by(Project.id.desc()).first()
            assert project is not None
            return project.id

    def logout(self) -> None:
        self.client.post("/logout", data={"_csrf_token": self.csrf()})

    def test_admin_sees_all_projects(self) -> None:
        self.create_user("alice")
        self.login("alice", "Pass1234!")
        self.create_project("Alice Project")
        self.logout()

        self.create_user("bob")
        self.login("bob", "Pass1234!")
        self.create_project("Bob Project")
        self.logout()

        self.login()
        response = self.client.get("/dashboard")
        self.assertEqual(response.status_code, 200)
        body = response.get_data(as_text=True)
        self.assertIn("Alice Project", body)
        self.assertIn("Bob Project", body)

    def test_user_sees_only_own_projects(self) -> None:
        self.create_user("alice")
        self.login("alice", "Pass1234!")
        alice_id = self.create_project("Alice Only")
        self.logout()

        self.create_user("bob")
        self.login("bob", "Pass1234!")
        self.create_project("Bob Only")
        self.logout()

        self.login("alice", "Pass1234!")
        dashboard = self.client.get("/dashboard")
        body = dashboard.get_data(as_text=True)
        self.assertIn("Alice Only", body)
        self.assertNotIn("Bob Only", body)

        denied = self.client.get(f"/projects/{alice_id}")
        self.assertEqual(denied.status_code, 200)

        with self.app.app_context():
            bob_project = Project.query.filter_by(name="Bob Only").one()
            bob_id = bob_project.id

        blocked = self.client.get(f"/projects/{bob_id}")
        self.assertEqual(blocked.status_code, 403)


if __name__ == "__main__":
    unittest.main()
