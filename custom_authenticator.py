import os
from jinja2 import ChoiceLoader, FileSystemLoader
from nativeauthenticator import NativeAuthenticator
from nativeauthenticator.handlers import SignUpHandler, LocalBase
from tornado import web

# Directory of THIS file, containing our custom templates/
CUSTOM_TEMPLATE_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates")


class CustomSignUpHandler(SignUpHandler):
    """Override SignUpHandler to extract 'role' from POST and pass it to create_user."""

    _custom_template_registered = False

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Register our custom templates dir BEFORE the NativeAuthenticator one
        # so our signup.html takes priority
        if not CustomSignUpHandler._custom_template_registered:
            self.log.info("Registering custom template dir: %s", CUSTOM_TEMPLATE_DIR)
            env = self.settings["jinja2_env"]
            previous_loader = env.loader
            # ChoiceLoader tries loaders in order; put ours first
            env.loader = ChoiceLoader([FileSystemLoader([CUSTOM_TEMPLATE_DIR]), previous_loader])
            CustomSignUpHandler._custom_template_registered = True

    def get_result_message(
        self,
        user,
        assume_user_is_human,
        username_already_taken,
        confirmation_matches,
        user_is_admin,
    ):
        """Override to translate messages into Simplified Chinese."""
        if not assume_user_is_human:
            alert = "alert-danger"
            message = "您未通过 reCAPTCHA 验证，请重试。"
        elif username_already_taken:
            alert = "alert-danger"
            message = (
                "出错了！\n"
                "该用户名已被使用。请尝试使用其他用户名注册。"
            )
        elif not confirmation_matches:
            alert = "alert-danger"
            message = "两次输入的密码不一致，请重试。"
        elif not user:
            alert = "alert-danger"
            minimum_password_length = self.authenticator.minimum_password_length
            if minimum_password_length > 0:
                message = (
                    "出错了！\n"
                    "请确保用户名不包含空格、逗号或斜杠，且您的"
                    f"密码至少为 {minimum_password_length} 个"
                    "字符，并避免过于简单。"
                )
            else:
                message = (
                    "出错了！\n"
                    "请确保用户名不包含空格、逗号或斜杠，且"
                    "密码不应过于简单。"
                )
        elif (user is not None) and (self.authenticator.open_signup or user_is_admin):
            alert = "alert-success"
            message = "注册成功！您现在可以返回主页并登录系统了。"
        else:
            alert = "alert-info"
            message = "您的注册信息已发送给管理员审核。"

            if (user is not None) and getattr(user, 'login_email_sent', False):
                message = "注册成功！请检查您的邮箱以授权访问权限。"

        return alert, message

    async def post(self):
        """Handle signup POST with role extraction."""

        # 404 if users aren't allowed to sign up
        if not self.authenticator.enable_signup:
            raise web.HTTPError(404)

        # reCAPTCHA check (simplified — match parent logic)
        if not self.authenticator.recaptcha_key:
            assume_user_is_human = True
        else:
            assume_user_is_human = False
            import requests as req
            recaptcha_response = self.get_body_argument("g-recaptcha-response", strip=True)
            if recaptcha_response != "":
                data = {
                    "secret": self.authenticator.recaptcha_secret,
                    "response": recaptcha_response,
                }
                validation = req.post("https://www.google.com/recaptcha/api/siteverify", data=data)
                assume_user_is_human = validation.json().get("success")

        # ---- Extract role and course_id (our custom fields) ----
        role = self.get_body_argument("role", "student")
        course_id = self.get_body_argument("course_id", "").strip()

        # Standard user info
        user_info = {
            "username": self.get_body_argument("username", strip=False),
            "password": self.get_body_argument("signup_password", strip=False),
            "email": self.get_body_argument("email", "", strip=False),
            "has_2fa": bool(self.get_body_argument("2fa", "", strip=False)),
        }
        username = user_info["username"]

        password = user_info["password"]
        confirmation = self.get_body_argument("signup_password_confirmation", strip=False)
        confirmation_matches = password == confirmation
        user_is_admin = username in self.authenticator.admin_users
        username_already_taken = self.authenticator.user_exists(username)

        # Create user if everything checks out
        user = None
        if assume_user_is_human and not username_already_taken and confirmation_matches:
            user = self.authenticator.create_user(role=role, course_id=course_id, **user_info)

        # Build response message
        alert, message = self.get_result_message(
            user,
            assume_user_is_human,
            username_already_taken,
            confirmation_matches,
            user_is_admin,
        )

        otp_secret, user_2fa = "", ""
        if user:
            otp_secret = user.otp_secret
            user_2fa = user.has_2fa

        html = await self.render_template(
            "signup.html",
            ask_email=self.authenticator.ask_email_on_signup,
            result_message=message,
            alert=alert,
            two_factor_auth=self.authenticator.allow_2fa,
            two_factor_auth_user=user_2fa,
            two_factor_auth_value=otp_secret,
            recaptcha_key=self.authenticator.recaptcha_key,
            tos=self.authenticator.tos,
        )
        self.finish(html)


class CustomNativeAuthenticator(NativeAuthenticator):
    """Extends NativeAuthenticator with dynamic multi-course role assignment."""

    def get_handlers(self, app):
        """Replace the default SignUpHandler with our CustomSignUpHandler."""
        handlers = super().get_handlers(app)
        new_handlers = []
        for path, handler in handlers:
            if path == r"/signup":
                new_handlers.append((path, CustomSignUpHandler))
            else:
                new_handlers.append((path, handler))
        return new_handlers

    def create_user(self, username, password, role='student', course_id='', **kwargs):
        """
        Create user in NativeAuthenticator DB, then add them
        to the appropriate JupyterHub group for nbgrader.

        - Teachers: added to formgrade-{course_id}
        - Students: NOT added to any group at registration.
          Teachers add students via Formgrader later.
        """
        user_info = super().create_user(username, password, **kwargs)

        if user_info:
            from jupyterhub import orm

            self.log.info(f"User '{username}' created with role='{role}'")

            # Ensure Hub user record exists
            hub_user = orm.User.find(self.db, name=username)
            if not hub_user:
                hub_user = orm.User(name=username)
                self.db.add(hub_user)
                self.db.commit()

            if role == 'teacher' and course_id:
                group_name = f'formgrade-{course_id}'

                # Ensure group exists
                hub_group = orm.Group.find(self.db, name=group_name)
                if not hub_group:
                    hub_group = orm.Group(name=group_name)
                    self.db.add(hub_group)
                    self.db.commit()
                    self.log.info(f"Created new course group '{group_name}'")

                # Add teacher to course group
                if hub_user not in hub_group.users:
                    hub_group.users.append(hub_user)
                    self.db.commit()
                    self.log.info(f"Added teacher '{username}' to group '{group_name}'")
                    
                # Ensure global 'teachers' group exists and add teacher to it
                teachers_group = orm.Group.find(self.db, name='teachers')
                if not teachers_group:
                    teachers_group = orm.Group(name='teachers')
                    self.db.add(teachers_group)
                    self.db.commit()
                if hub_user not in teachers_group.users:
                    teachers_group.users.append(hub_user)
                    self.db.commit()
                    self.log.info(f"Added teacher '{username}' to global 'teachers' group")
            else:
                # Students: add to nbgrader-{course_id} group if a course is selected
                if course_id:
                    group_name = f'nbgrader-{course_id}'
                    hub_group = orm.Group.find(self.db, name=group_name)
                    if not hub_group:
                        hub_group = orm.Group(name=group_name)
                        self.db.add(hub_group)
                        self.db.commit()
                        self.log.info(f"Created new student group '{group_name}'")
                    if hub_user not in hub_group.users:
                        hub_group.users.append(hub_user)
                        self.db.commit()
                        self.log.info(f"Added student '{username}' to group '{group_name}'")
                else:
                    self.log.info(f"Student '{username}' registered (no course assigned yet)")

        return user_info
