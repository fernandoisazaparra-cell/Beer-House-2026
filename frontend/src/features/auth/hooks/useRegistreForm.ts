import React, { useState } from "react";

import { useAuth } from "@/app/context";

import {
  registreUser,
  verifyEmail,
  RepeatToken,
  loginGoogle,
  type ApiErrorResponse,
  ApiError,
} from "../services";

import { useGoogleLogin } from "@react-oauth/google";

export const useRegistreForm = () => {
  const { login, loginWithGoogle } = useAuth();

  const [terms, setTerms] = useState(false);
  const [years, setYear] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [errorsToken, setErrorsToken] = useState<Record<string, string[]>>({});
  const [verifyError, setVerifyError] = useState<Record<string, string[]>>({});
  const [verifyLogin, setVerifyLogin] = useState<Record<string, string[]>>({});

  const [showVerify, setShowVerify] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [registeredPassword, setRegisteredPassword] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    const firstName = String(formData.get("first_name") ?? "").trim();
    const lastName = String(formData.get("last_name") ?? "").trim();

    const data = {
      name: `${firstName} ${lastName}`.trim(),
      first_name: firstName,
      last_name: lastName,
      email: String(formData.get("email") ?? "").trim(),
      password: String(formData.get("password") ?? ""),
      terms,
      years,
    };
    try {
      setIsLoading(true);
      setErrors({});

      if (!firstName || !lastName) {
        setErrors({
          general: ["Debes ingresar tu nombre y apellido."],
        });
        return;
      }

      if (!terms || !years) {
        setErrors({
          general: [
            "Debes aceptar los términos y confirmar la declaración de edad.",
          ],
        });
        return;
      }

      await registreUser(data);

      setRegisteredEmail(data.email);
      setRegisteredPassword(data.password);
      setShowVerify(true);
    } catch (err) {
      const result = err as ApiErrorResponse;

      if (result instanceof ApiError) {
        setErrors(
          result.errors ?? {
            general: [result.message],
          },
        );
      } else if (result && "message" in result) {
        setErrors({
          general: [result.message ?? "No fue posible completar el registro."],
        });
      } else {
        setErrors({
          general: ["No fue posible completar el registro."],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = async (event: React.SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const data = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      setIsLoading(true);
      setVerifyLogin({});
      await login(data.email, data.password);
    } catch (err) {
      const result = err as ApiErrorResponse;
      if ("errors" in result) {
        setErrors(result.errors ?? {});
      } else if ("message" in result) {
        setErrors({
          general: [result.message ?? "No fue posible iniciar sesión."],
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (code: string) => {
    try {
      setVerifyError({});
      await verifyEmail({
        email: registeredEmail,
        code,
      });

      setShowVerify(false);
      await login(registeredEmail, registeredPassword);
    } catch (err) {
      const result = err as ApiErrorResponse;
      if ("errors" in result) {
        setVerifyError(result.errors ?? {});
      } else if ("message" in result) {
        setVerifyError({
          code: [result.message ?? "No fue posible verificar el correo."],
        });
      }
    }
  };

  const handleToken = async (email: string) => {
    try {
      setErrorsToken({});
      await RepeatToken(email);
    } catch (err) {
      if (err instanceof Error) {
        setErrorsToken({
          general: [err.message],
        });
      } else {
        setErrorsToken({
          general: ["Ocurrió un error inesperado."],
        });
      }
    }
  };

  const handleGoogleLogin = useGoogleLogin({
    flow: "auth-code",
    onSuccess: async (codeResponse) => {
      try {
        const result = await loginGoogle(codeResponse.code);
        loginWithGoogle(result);
      } catch (err) {
        if (err instanceof Error) {
          setErrorsToken({ general: [err.message] });
        } else {
          setErrorsToken({ general: ["Ocurrió un error inesperado."] });
        }
      }
    },
    onError: () => {
      console.error("Error al iniciar sesión con Google");
    },
  });

  return {
    terms,
    setTerms,

    years,
    setYear,

    isLoading,

    errors,
    errorsToken,
    verifyLogin,
    handleSubmit,
    handleToken,
    handleLogin,
    handleGoogleLogin,

    showVerify,
    setShowVerify,

    registeredEmail,

    handleVerify,

    verifyError,
    setVerifyError,
  };
};
