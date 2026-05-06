"use client";

import { EyeClosedIcon, EyeOpenIcon } from "@/assets/login-icons";
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import InputGroup from "@/components/form-elements/input-group";
import { login, verifyDashboardOtp, persistAuthSession, AuthError, syncMe, type AuthSuccessResponse } from "@/lib/auth-api";
import { getLoginAuthErrorDisplay } from "@/lib/auth-error-messages";
import { getDefaultDashboardPath } from "@/lib/dashboard-routing";

const DEMO_BYPASS_EMAIL = "demo@zwippe.com";
const DEMO_BYPASS_PASSWORD = "Zelify2026@";
const DEMO_BYPASS_STORAGE_KEY = "zelify_demo_bypass";

// ============================================================================
// TRANSLATIONS
// ============================================================================
const TRANSLATIONS = {
  en: {
    welcome: "Welcome back",
    subWelcome: "Sign in to your account to access the dashboard.",
    email: "Email",
    password: "Password",
    signIn: "Sign In",
    signingIn: "Signing in...",
    incCreds: "Incorrect credentials.",
    invalidEmail: "Email must contain '@' and a valid format.",
    reqEmail: "Email is required.",
    reqPassword: "Password is required.",
    placeholderEmail: "admin@company.com",
    placeholderPassword: "Enter your password",
    noAccount: "Don't have an account? ",
    createAccount: "Create your account",
    otpTitle: "Verify your identity",
    otpSub: "We've sent a 6-digit code to your email.",
    otpPlaceholder: "123456",
    verify: "Verify OTP",
    verifying: "Verifying...",
    otpLabel: "Verification Code",
    reqOtp: "Verification code is required.",
    organizationId: "Branch ID",
    organizationIdPlaceholder: "b9b3b8c5-0bfe-4fb8-8f6b-0e2d9a6a9d11",
    reqOrganizationId: "Branch ID is required for this email.",
    organizationIdHelp: "This email belongs to multiple branches. Enter the branch ID to continue.",
    showPasswordAria: "Show password",
    hidePasswordAria: "Hide password",
    sessionExpiredInfo: "Your session has expired. Please sign in again.",
  },
  es: {
    welcome: "Zelify Core",
    subWelcome: "Inicia sesión en tu cuenta para acceder al panel.",
    email: "Correo electrónico",
    password: "Contraseña",
    signIn: "Iniciar sesión",
    signingIn: "Iniciando sesión...",
    incCreds: "Credenciales incorrectas.",
    invalidEmail: "El correo debe contener '@' y un formato válido.",
    reqEmail: "El correo es obligatorio.",
    reqPassword: "La contraseña es obligatoria.",
    placeholderEmail: "admin@tuempresa.com",
    placeholderPassword: "Ingresa tu contraseña", 
    noAccount: "¿No tienes cuenta? ",
    createAccount: "Crear cuenta",
    otpTitle: "Verifica tu identidad",
    otpSub: "Hemos enviado un código de 6 dígitos a su correo electrónico.",
    otpPlaceholder: "123456",
    verify: "Verificar código",
    verifying: "Verificando...",
    otpLabel: "Código de verificación",
    reqOtp: "El código de verificación es obligatorio.",
    organizationId: "ID de sede",
    organizationIdPlaceholder: "b9b3b8c5-0bfe-4fb8-8f6b-0e2d9a6a9d11",
    reqOrganizationId: "El ID de sede es obligatorio para este correo.",
    organizationIdHelp: "Este correo existe en múltiples sedes. Ingresa el ID de la sede para continuar.",
    showPasswordAria: "Mostrar contraseña",
    hidePasswordAria: "Ocultar contraseña",
    sessionExpiredInfo: "Tu sesión ha expirado. Inicia sesión de nuevo.",
  },
};

// ============================================================================
// CONSTANTS - Colors (Cambia estos colores fácilmente)
// ============================================================================
const COLORS = {
  // Background colors
  backgroundLight: "#f1f5f9", // Light mode background
  backgroundDark: "#001832", // Dark mode background

  // Card colors
  cardLight: "#ffffff", // Light mode card
  cardDark: "#0d1224", // Dark mode card

  // Right panel colors
  rightPanelBg: "rgb(170, 255, 59)", // Color verde del panel derecho
  rightPanelBorderDark: "#04335A", // Borde del panel derecho en dark mode

  // Button colors
  buttonPrimaryLight: "#004195", // Botón en light mode
  buttonPrimaryLightHover: "#0a56c2", // Hover del botón en light mode
  buttonPrimaryDark: "#66ff00", // Botón en dark mode (verde)
  buttonPrimaryDarkHover: "#ffffff", // Hover del botón en dark mode

  // Error colors
  errorBorder: "#dd2f2c", // Color del borde de error

  // Animation colors (para la animación halftone)
  halftoneLight: "rgb(12, 13, 14)", // Color de puntos en light mode
  halftoneDark: "rgba(255, 255, 255, 1)", // Color de puntos en dark mode
} as const;

// ============================================================================
// CONSTANTS - Logo URLs (Cambia las URLs de los logos aquí)
// ============================================================================
const LOGO_URLS = {
  dark: "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_dark.svg",
  light:
    "https://flowchart-diagrams-zelify.s3.us-east-1.amazonaws.com/zelifyLogo_ligth.svg",
} as const;

function AnimatedHalftoneBackdrop({ isDarkMode }: { isDarkMode: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  const resizeObserverRef = useRef<ResizeObserver | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const parent = canvas.parentElement;
    if (!parent) return;

    const dpr =
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;

    const resize = () => {
      const { width, height } = parent.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(resize);
      observer.observe(parent);
      resizeObserverRef.current = observer;
    }

    let start = performance.now();
    const spacing = 26;
    const waveFrequency = 1.35;
    const waveSpeed = 0.35;

    const render = (time: number) => {
      const elapsed = (time - start) / 1000;
      const logicalWidth = canvas.width / dpr;
      const logicalHeight = canvas.height / dpr;
      ctx.clearRect(0, 0, logicalWidth, logicalHeight);

      const centerX = logicalWidth / 2;
      const centerY = logicalHeight / 2;
      const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
      // Usar colores de las constantes - parsear rgba
      const halftoneColor = isDarkMode
        ? COLORS.halftoneDark
        : COLORS.halftoneLight;
      const rgbaMatch = halftoneColor.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
      const [r, g, b] = rgbaMatch
        ? [Number(rgbaMatch[1]), Number(rgbaMatch[2]), Number(rgbaMatch[3])]
        : [255, 255, 255];

      for (let y = -spacing; y <= logicalHeight + spacing; y += spacing) {
        for (let x = -spacing; x <= logicalWidth + spacing; x += spacing) {
          const dx = x - centerX;
          const dy = y - centerY;
          const distance = Math.sqrt(dx * dx + dy * dy);
          const normalizedDistance = distance / maxDistance;
          const wavePhase =
            (normalizedDistance * waveFrequency - elapsed * waveSpeed) *
            Math.PI *
            2;
          const pulse = (Math.cos(wavePhase) + 1) / 2;
          const edgeFade = Math.pow(1 - normalizedDistance, 1.4);
          const alpha = (0.06 + pulse * 0.45) * edgeFade;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
          ctx.beginPath();
          ctx.arc(x, y, 1.4 + pulse * 0.6, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(render);
    };

    animationRef.current = requestAnimationFrame(render);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (resizeObserverRef.current) resizeObserverRef.current.disconnect();
    };
  }, [isDarkMode]);

  return <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />;
}

function EdgeFadeOverlay({ isDarkMode }: { isDarkMode: boolean }) {
  const fadeColor = isDarkMode ? "rgba(8,11,25,1)" : "rgba(250,252,255,1)";
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-3xl"
      style={{
        background: `radial-gradient(circle at center, rgba(0,0,0,0) 60%, ${fadeColor} 100%)`,
      }}
    ></div>
  );
}

export default function LoginPage() {
  const [data, setData] = useState({
    email: "",
    password: "",
    organization_id: "",
  });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<1 | 2>(1);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [language, setLanguage] = useState<"en" | "es">("es");

  const toggleLanguage = () => {
    const newLang = language === "en" ? "es" : "en";
    setLanguage(newLang);
    localStorage.setItem("zelify-language", newLang);
  };

  // Validation State
  const [formErrors, setFormErrors] = useState({
    email: "",
    password: "",
    organization_id: "",
  });
  const [requiresOrganizationId, setRequiresOrganizationId] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sessionExpiredInfo, setSessionExpiredInfo] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const t = TRANSLATIONS[language];

  /** Devuelve el mensaje de error para un campo (validación en tiempo real). */
  const getFieldError = (
    name: "email" | "password" | "organization_id",
    d: { email: string; password: string; organization_id: string }
  ): string => {
    if (name === "email") {
      if (!d.email) return t.reqEmail;
      if (!d.email.includes("@") || !emailRegex.test(d.email)) return t.invalidEmail;
      return "";
    }
    if (name === "password") {
      return !d.password ? t.reqPassword : "";
    }
    if (name === "organization_id") {
      if (requiresOrganizationId && !d.organization_id.trim()) return t.reqOrganizationId;
      return "";
    }
    return "";
  };

  // Detectar modo dark/light
  useEffect(() => {
    const checkDarkMode = () => {
      const isDark = document.documentElement.classList.contains("dark");
      setIsDarkMode(isDark);
    };

    checkDarkMode();

    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("reason") === "session_expired") {
      setSessionExpiredInfo(true);
      params.delete("reason");
      const q = params.toString();
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${q ? `?${q}` : ""}`,
      );
    }
  }, []);

  // Agregar estilos de animación
  useEffect(() => {
    const styleId = "login-halftone-animations";
    if (typeof document !== "undefined" && !document.getElementById(styleId)) {
      const style = document.createElement("style");
      style.id = styleId;
      style.textContent = `
        @keyframes halftonePulse {
          0%, 100% { opacity: 0; }
          50% { opacity: 0.8; }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const validateForm = () => {
    let isValid = true;
    const newErrors = { email: "", password: "", organization_id: "" };

    // Email validation
    if (!data.email) {
      newErrors.email = t.reqEmail;
      isValid = false;
    } else if (!data.email.includes("@") || !emailRegex.test(data.email)) {
      // Explicit check for @ as requested, though regex covers it
      newErrors.email = t.invalidEmail;
      isValid = false;
    }

    // Password validation (basic check)
    if (!data.password) {
      newErrors.password = t.reqPassword;
      isValid = false;
    }

    if (requiresOrganizationId && !data.organization_id.trim()) {
      newErrors.organization_id = t.reqOrganizationId;
      isValid = false;
    }

    setFormErrors(newErrors);
    return isValid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as { name: "email" | "password" | "organization_id"; value: string };
    const nextData = { ...data, [name]: value };
    setData(nextData);
    setError("");
    if (name === "email" && requiresOrganizationId) {
      setRequiresOrganizationId(false);
      setFormErrors((prev) => ({ ...prev, organization_id: "" }));
    }
    const fieldError = getFieldError(name, nextData);
    setFormErrors((prev) => ({ ...prev, [name]: fieldError }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedEmail = data.email.trim().toLowerCase();
    const isDemoBypassLogin =
      normalizedEmail === DEMO_BYPASS_EMAIL && data.password === DEMO_BYPASS_PASSWORD;

    if (isDemoBypassLogin) {
      const demoAuthSession: AuthSuccessResponse = {
        access_token: "demo-bypass-access-token",
        refresh_token: "demo-bypass-refresh-token",
        user: {
          id: "demo-bypass-user",
          email: DEMO_BYPASS_EMAIL,
          full_name: "Demo User",
          status: "ACTIVE",
        },
        organization: {
          id: "demo-bypass-org",
          name: "Demo Organization",
          status: "ACTIVE",
        },
        roles: ["OWNER"],
      };
      persistAuthSession(demoAuthSession);
      if (typeof window !== "undefined") {
        sessionStorage.setItem(DEMO_BYPASS_STORAGE_KEY, "true");
      }
      setLoading(false);
      window.location.href = getDefaultDashboardPath(demoAuthSession.roles);
      return;
    }

    if (typeof window !== "undefined") {
      sessionStorage.removeItem(DEMO_BYPASS_STORAGE_KEY);
    }

    const authBaseUrl = process.env.NEXT_PUBLIC_AUTH_API_URL;
    if (!authBaseUrl) {
      setLoading(false);
      setError(
        language === "en"
          ? "Auth API URL is not configured. Set NEXT_PUBLIC_AUTH_API_URL in .env"
          : "La URL de la API de auth no está configurada. Configura NEXT_PUBLIC_AUTH_API_URL en .env",
      );
      return;
    }

    if (step === 1) {
      if (!validateForm()) {
        setLoading(false);
        return;
      }

      try {
        const result = await login({
          email: data.email,
          password: data.password,
          organization_id: data.organization_id.trim() || undefined,
        });

        // Caso bypass de OTP ( tokens directos )
        if ("access_token" in result || "accessToken" in result) {
          const authResult = result as AuthSuccessResponse;
          if (authResult.user && authResult.organization) {
            persistAuthSession(authResult);
            try {
              await syncMe();
            } catch {
              /* mantener datos del response */
            }
            setLoading(false);
            window.location.href = getDefaultDashboardPath(authResult.roles);
            return;
          }
        }

        if ("session_id" in result) {
          setSessionId(result.session_id);
          setStep(2);
          setLoading(false);
          return;
        }

        setLoading(false);
        const loginResult = result as { message?: string; organizations?: Array<{ id: string; name: string }> };
        if (Array.isArray(loginResult.organizations) || loginResult.message?.includes("organization_id")) {
          setRequiresOrganizationId(true);
          setFormErrors((prev) => ({
            ...prev,
            organization_id: !data.organization_id.trim() ? t.reqOrganizationId : "",
          }));
        }
        setError(loginResult.message || t.incCreds);
      } catch (err) {
        handleAuthError(err);
      }
    } else {
      // Step 2: Verify OTP
      if (!otp) {
        setError(t.reqOtp);
        setLoading(false);
        return;
      }

      try {
        const result = await verifyDashboardOtp({
          session_id: sessionId,
          otp_code: otp,
        });

        const hasToken = "access_token" in result || "accessToken" in result;
        if (hasToken && result.user && result.organization) {
          persistAuthSession(result as AuthSuccessResponse);
          try {
            await syncMe();
          } catch {
            /* mantener datos del response */
          }
          setLoading(false);
          window.location.href = getDefaultDashboardPath(result.roles);
          return;
        }

        setLoading(false);
        setError(t.incCreds);
      } catch (err) {
        handleAuthError(err);
      }
    }
  };

  const handleAuthError = (err: unknown) => {
    console.error("Auth error:", err);
    setLoading(false);
    if (err instanceof AuthError) {
      setError(getLoginAuthErrorDisplay(err, step, language));
    } else {
      setError(
        err instanceof Error
          ? err.message
          : language === "en"
            ? "Connection error. Please try again."
            : "Error de conexión. Por favor intenta de nuevo.",
      );
    }
  };

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-gray-2 px-4 overflow-hidden"
      style={{
        backgroundColor: isDarkMode
          ? COLORS.backgroundDark
          : COLORS.backgroundLight,
      }}
    >
      <div className="absolute top-6 right-6 z-50 transition-transform duration-300 hover:scale-105">
        <button
          onClick={toggleLanguage}
          className="flex items-center justify-center rounded-lg border-2 border-dark px-3 py-1.5 font-bold text-dark dark:border-white dark:text-white bg-white/10 backdrop-blur-sm"
        >
          {language === "en" ? "EN" : "ES"}
        </button>
      </div>

      {/* ======================================================================
          ANIMACIÓN DE FONDO - Aquí se aplica la animación halftone
          ====================================================================== */}
      <div className="absolute inset-0">
        {/* Base gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: isDarkMode
              ? "linear-gradient(135deg, rgba(0, 24, 50, 0.95) 0%, rgba(0, 8, 26, 1) 50%, rgba(0, 24, 50, 0.95) 100%)"
              : "linear-gradient(135deg, rgba(241, 245, 249, 0.95) 0%, rgba(226, 232, 240, 1) 50%, rgba(241, 245, 249, 0.95) 100%)",
          }}
        ></div>

        {/* ANIMACIÓN PRINCIPAL: Puntos halftone animados con efecto de onda */}
        <AnimatedHalftoneBackdrop isDarkMode={isDarkMode} />

        {/* Overlay con fade en los bordes */}
        <EdgeFadeOverlay isDarkMode={isDarkMode} />

        {/* Capa adicional de patrón halftone con animación de pulso */}
        <div
          className="absolute inset-0 mix-blend-overlay"
          style={{
            backgroundImage: isDarkMode
              ? `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.2) 1.2px, transparent 0)`
              : `radial-gradient(circle at 2px 2px, rgba(0,0,0,0.12) 1.2px, transparent 0)`,
            backgroundSize: "28px 28px",
            opacity: 0.5,
            animation: "halftonePulse 8s ease-in-out infinite",
          }}
        ></div>
      </div>

      {/* CONTENEDOR PRINCIPAL - solo formulario */}
      <div className="relative z-10 w-full max-w-[440px]">
        <div
          className="relative rounded-[10px] shadow-1 dark:shadow-card"
          style={{
            backgroundColor: isDarkMode ? COLORS.cardDark : COLORS.cardLight,
          }}
        >
          {loading ? (
            <div
              className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-3 rounded-[10px] bg-white/75 px-6 backdrop-blur-sm dark:bg-[#0d1224]/85"
              role="status"
              aria-live="polite"
              aria-busy="true"
            >
              <div
                className="h-10 w-10 animate-spin rounded-full border-[3px] border-solid border-current border-t-transparent text-primary dark:text-[#66ff00]"
                aria-hidden
              />
              <span className="text-center text-sm font-medium text-dark dark:text-white">
                {step === 1 ? t.signingIn : t.verifying}
              </span>
            </div>
          ) : null}
          <div className="w-full p-4 sm:p-10">
            {sessionExpiredInfo ? (
              <div
                className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-100"
                role="status"
              >
                {t.sessionExpiredInfo}
              </div>
            ) : null}
            {/* Logo + título centrados */}
            <div className="mb-10 flex justify-center">
              <Link href="/" className="inline-block">
                <Image
                  className="hidden dark:block"
                  src={LOGO_URLS.dark}
                  alt="Zelify Logo"
                  width={176}
                  height={32}
                />
                <Image
                  className="dark:hidden"
                  src={LOGO_URLS.light}
                  alt="Zelify Logo"
                  width={176}
                  height={32}
                />
              </Link>
            </div>

            <h1 className="mb-2 text-center text-2xl font-bold text-dark dark:text-white sm:text-heading-3">
              {step === 1 ? t.welcome : t.otpTitle}
            </h1>
            <p className="mb-8 text-center text-sm text-dark-6 dark:text-dark-6">
              {step === 1 ? t.subWelcome : t.otpSub}
            </p>

            <form onSubmit={handleSubmit}>
              {/* Mensaje de error */}
              {error && (
                <div
                  className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20"
                  style={{
                    borderColor: isDarkMode
                      ? COLORS.errorBorder
                      : undefined,
                    color: isDarkMode ? COLORS.errorBorder : undefined,
                  }}
                >
                  {error}
                </div>
              )}

              {step === 1 ? (
                <>
                  <InputGroup
                    type="email"
                    variant="minimal"
                    label={t.email}
                    className={`mb-4 ${formErrors.email
                      ? "[&_input]:border-red-400/75 [&_input]:focus:border-red-400/90 [&_input]:focus:ring-red-500/12"
                      : ""
                      }`}
                    placeholder={t.placeholderEmail}
                    name="email"
                    handleChange={handleChange}
                    value={data.email}
                    required
                  />
                  {formErrors.email && (
                    <p className="mb-4 mt-[-10px] text-sm text-red-500">
                      {formErrors.email}
                    </p>
                  )}

                  <InputGroup
                    type={showPassword ? "text" : "password"}
                    variant="minimal"
                    label={t.password}
                    className={`mb-5 ${formErrors.password
                      ? "[&_input]:border-red-400/75 [&_input]:focus:border-red-400/90 [&_input]:focus:ring-red-500/12"
                      : ""
                      }`}
                    placeholder={t.placeholderPassword}
                    name="password"
                    handleChange={handleChange}
                    value={data.password}
                    endAdornment={
                      <button
                        type="button"
                        aria-label={showPassword ? t.hidePasswordAria : t.showPasswordAria}
                        className="group inline-flex cursor-pointer items-center justify-center border-0 bg-transparent p-0 shadow-none outline-none ring-0 focus-visible:rounded focus-visible:ring-1 focus-visible:ring-primary/35"
                        onClick={() => setShowPassword((v) => !v)}
                      >
                        {showPassword ? (
                          <EyeClosedIcon
                            strokeWidth={1.5}
                            className="h-[18px] w-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                          />
                        ) : (
                          <EyeOpenIcon
                            strokeWidth={1.5}
                            className="h-[18px] w-[18px] shrink-0 text-slate-400 transition-colors group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                          />
                        )}
                      </button>
                    }
                    required
                  />
                  {formErrors.password && (
                    <p className="mb-5 mt-[-15px] text-sm text-red-500">
                      {formErrors.password}
                    </p>
                  )}

                  {requiresOrganizationId && (
                    <>
                      <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                        {t.organizationIdHelp}
                      </div>
                      <InputGroup
                        type="text"
                        variant="minimal"
                        label={t.organizationId}
                        className={`mb-4 ${formErrors.organization_id
                          ? "[&_input]:border-red-400/75 [&_input]:focus:border-red-400/90 [&_input]:focus:ring-red-500/12"
                          : ""
                          }`}
                        placeholder={t.organizationIdPlaceholder}
                        name="organization_id"
                        handleChange={handleChange}
                        value={data.organization_id}
                        required
                      />
                      {formErrors.organization_id && (
                        <p className="mb-4 mt-[-10px] text-sm text-red-500">
                          {formErrors.organization_id}
                        </p>
                      )}
                    </>
                  )}
                </>
              ) : (
                <>
                  <InputGroup
                    type="text"
                    variant="minimal"
                    label={t.otpLabel}
                    className="mb-5"
                    placeholder={t.otpPlaceholder}
                    name="otp"
                    handleChange={(e) => setOtp(e.target.value)}
                    value={otp}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="mb-4 text-sm font-medium text-primary hover:underline"
                  >
                    {language === "en" ? "Change email/password" : "Cambiar correo/contraseña"}
                  </button>
                </>
              )}

              {/* Botón de login */}
              <div className="mb-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg p-4 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    backgroundColor: isDarkMode
                      ? COLORS.buttonPrimaryDark
                      : COLORS.buttonPrimaryLight,
                    color: isDarkMode ? "#000000" : "#ffffff",
                  }}
                  onMouseEnter={(e) => {
                    if (!loading) {
                      e.currentTarget.style.backgroundColor = isDarkMode
                        ? COLORS.buttonPrimaryDarkHover
                        : COLORS.buttonPrimaryLightHover;
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = isDarkMode
                      ? COLORS.buttonPrimaryDark
                      : COLORS.buttonPrimaryLight;
                  }}
                >
                  {loading ? (
                    <>
                      {step === 1 ? t.signingIn : t.verifying}
                      <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-t-transparent" />
                    </>
                  ) : (
                    step === 1 ? t.signIn : t.verify
                  )}
                </button>
              </div>

              <p className="text-center text-sm text-dark-6 dark:text-dark-6">
                {t.noAccount}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  {t.createAccount}
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
