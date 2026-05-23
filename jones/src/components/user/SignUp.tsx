import { useState, useRef } from "react";
import { generateUsername } from "friendly-username-generator";

import TextField from "@Components/formControls/TextField";
import Button from "@Components/formControls/Button";

import { userSchema } from "@Lib/validations";
import { validateInput, validateInputs } from "src/helpers";
import { toast } from "react-toastify";
import { register } from "@Lib/api/auth";

const validateFormField = validateInput(userSchema);

export default function SignUp() {
  const [formErrors, setFormErrors] = useState<formParams>({});
  const [loading, setLoading] = useState(false);
  const generatedName = useRef(generateUsername());

  const handleSubmit = async (params: {
    username?: string;
    email?: string;
    password?: string;
    password2?: string;
  }) => {
    setLoading(true);
    try {
      const error = validateInputs(params, userSchema);
      if (error) {
        error.inner.forEach((err) => {
          setFormErrors((prev) => ({
            ...prev,
            [err.path as string]: err.message,
          }));
        });
        setLoading(false);
        return;
      }

      await register({
        username: params.username!,
        email: params.email!,
        password1: params.password!,
        password2: params.password2 || params.password!,
      });
      toast("Account created successfully!", { type: "success" });
      location.href = location.origin;
    } catch (err: any) {
      toast(err?.body?.detail || err?.message || "Registration failed", { type: "error" });
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="auth__header">Sign Up</h2>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const username = (form.querySelector("[name=username]") as HTMLInputElement)?.value;
          const email = (form.querySelector("[name=email]") as HTMLInputElement)?.value;
          const password = (form.querySelector("[name=password]") as HTMLInputElement)?.value;
          const password2 = (form.querySelector("[name=password2]") as HTMLInputElement)?.value;
          handleSubmit({ username, email, password, password2 });
        }}
      >
        <TextField
          error={formErrors["username"]}
          name="username"
          label="User"
          placeholder="eg., john_brown"
          required
          onBlur={(e) => {
            setFormErrors({
              ...formErrors,
              username: validateFormField("username", e.target.value),
            });
          }}
          defaultValue={generatedName.current}
        />
        <TextField
          error={formErrors["email"]}
          name="email"
          label="Email"
          type="email"
          placeholder="example@domain.com"
          required
          onBlur={(e) =>
            setFormErrors({
              ...formErrors,
              email: validateFormField("email", e.target.value),
            })
          }
        />
        <TextField
          error={formErrors["password"]}
          name="password"
          type="password"
          label="Password"
          placeholder="At least 7 characters"
          minLength={7}
          required
          onBlur={(e) =>
            setFormErrors({
              ...formErrors,
              password: validateFormField("password", e.target.value),
            })
          }
        />
        <TextField
          error={formErrors["password2"]}
          name="password2"
          type="password"
          label="Confirm Password"
          placeholder="Re-enter password"
          minLength={7}
          required
          onBlur={(e) =>
            setFormErrors({
              ...formErrors,
              password2: validateFormField("password2", e.target.value),
            })
          }
        />
        <Button type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </Button>
      </form>
    </>
  );
}

interface formParams {
  username?: string;
  email?: string;
  password?: string;
  password2?: string;
}
