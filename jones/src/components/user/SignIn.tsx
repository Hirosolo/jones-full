import { useState } from "react";

import Form from "@Components/common/Form";
import TextField from "@Components/formControls/TextField";
import Button from "@Components/formControls/Button";

import { userLoginSchema } from "@Lib/validations";
import { validateInput, validateInputs } from "src/helpers";
import { toast } from "react-toastify";
import { login } from "@Lib/api/auth";

const validateFormField = validateInput(userLoginSchema);

export default function SignIn() {
  const [formErrors, setFormErrors] = useState<formParams>({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (params: { email?: string; password?: string }) => {
    setLoading(true);
    try {
      const error = validateInputs(params, userLoginSchema);
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

      await login(params.email!, params.password!);
      toast("Signed in successfully!", { type: "success" });
      location.href = location.origin;
    } catch (err: any) {
      toast(err?.body?.detail || err?.message || "Invalid credentials", { type: "error" });
      setLoading(false);
    }
  };

  return (
    <>
      <h2 className="auth__header">Sign In</h2>
      <form
        className="form"
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget;
          const email = (form.querySelector("[name=email]") as HTMLInputElement)?.value;
          const password = (form.querySelector("[name=password]") as HTMLInputElement)?.value;
          handleSubmit({ email, password });
        }}
      >
        <TextField
          error={formErrors["email"]}
          name="email"
          label="Email or User"
          placeholder="eg., example@domain.com or john_brown"
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
        <Button type="submit" disabled={loading}>
          {loading ? "Signing in..." : "Sign In"}
        </Button>
      </form>
    </>
  );
}

interface formParams {
  email?: string;
  password?: string;
}
