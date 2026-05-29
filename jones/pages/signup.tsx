import SEO from "@Components/common/SEO";
import AuthForm from "@Components/user/AuthForm";

export default function SignUpPage() {
  return (
    <div className="auth-page">
      <SEO title="Sign Up" noindex />
      <AuthForm isNewUser={true} />
    </div>
  );
}
