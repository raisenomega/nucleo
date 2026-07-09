import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useI18n } from "@shared/i18n";

// Input de contraseña con toggle ojo (mostrar/ocultar). Reutilizable en login/registro/etc.
type Props = {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
};

export function PasswordInput({ value, onChange, placeholder, autoComplete, className }: Props) {
  const { t } = useI18n();
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input type={show ? "text" : "password"} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete} className={`${className ?? ""} pr-10`} />
      <button type="button" tabIndex={-1} onClick={() => setShow((s) => !s)}
        aria-label={show ? t("hidePassword") : t("showPassword")}
        className="absolute inset-y-0 right-3 flex items-center text-muted-foreground">
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}
