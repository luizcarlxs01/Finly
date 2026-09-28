"use client";

import { useRef, useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Tabs } from "@base-ui/react/tabs";
import { LockKeyhole, LogOut, User } from "lucide-react";
import { EmailVerificationForm } from "@/components/auth/email-verification-form";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Button } from "@/components/ui/button";
import { useAuthSession } from "@/hooks/use-auth-session";

type AccessIntent = "login" | "register";

function AccountAccessContent({
  auth,
}: {
  auth: ReturnType<typeof useAuthSession>;
}) {
  const {
    authenticated,
    isLoaded,
    isSubmitting,
    pendingVerification,
    login,
    register,
    verifyCode,
    resendCode,
    cancelVerification,
    forgotPassword,
    logout,
    session,
  } = auth;
  const [activeIntent, setActiveIntent] = useState<AccessIntent>("login");
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  if (!isLoaded) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Carregando acesso da conta...
      </p>
    );
  }

  if (authenticated && session) {
    return (
      <div className="space-y-4">
        <dl className="space-y-3 rounded-xl bg-muted/30 p-3">
          <div>
            <dt className="text-xs text-muted-foreground">Nome</dt>
            <dd className="wrap-break-word text-sm font-medium">{session.name}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">E-mail</dt>
            <dd className="break-all text-sm">{session.email}</dd>
          </div>
        </dl>
        <div className="border-t border-border/60 pt-4">
          <Button
            type="button"
            variant="outline"
            className="w-full rounded-xl"
            onClick={logout}
          >
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </div>
    );
  }

  if (pendingVerification) {
    return (
      <EmailVerificationForm
        email={pendingVerification.email}
        isSubmitting={isSubmitting}
        onVerify={verifyCode}
        onResend={resendCode}
        onCancel={cancelVerification}
      />
    );
  }

  if (isForgotPasswordOpen) {
    return (
      <ForgotPasswordForm
        isSubmitting={isSubmitting}
        onSubmit={forgotPassword}
        onCancel={() => setIsForgotPasswordOpen(false)}
      />
    );
  }

  return (
    <Tabs.Root
      value={activeIntent}
      onValueChange={(value: AccessIntent) => setActiveIntent(value)}
      className="space-y-4"
    >
      <Tabs.List
        aria-label="Acesso da conta"
        className="grid grid-cols-2 gap-1 rounded-full bg-muted/40 p-1"
      >
        <Tabs.Tab
          value="login"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-card data-active:text-primary data-active:shadow-sm"
        >
          Entrar
        </Tabs.Tab>
        <Tabs.Tab
          value="register"
          className="rounded-full px-3 py-1.5 text-xs font-medium text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring data-active:bg-card data-active:text-primary data-active:shadow-sm"
        >
          Cadastrar
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="login">
        <LoginForm
          compact
          isSubmitting={isSubmitting}
          onSubmit={login}
          onForgotPassword={() => setIsForgotPasswordOpen(true)}
        />
      </Tabs.Panel>
      <Tabs.Panel value="register">
        <RegisterForm
          isSubmitting={isSubmitting}
          onSubmit={register}
          footerText="Seu acesso ficará salvo neste navegador."
        />
      </Tabs.Panel>

      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        Modo sem conta — dados salvos neste navegador
      </p>
    </Tabs.Root>
  );
}

export function AccountAccessCard() {
  const auth = useAuthSession();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const identity = auth.authenticated ? auth.session : null;

  return (
    <Popover.Root>
      <Popover.Trigger
        ref={triggerRef}
        aria-label={identity ? `Conta de ${identity.name}` : "Conta"}
        title={identity ? identity.name : "Acesse sua conta"}
        render={
          <Button
            variant="outline"
            size="icon-sm"
            className="rounded-xl sm:rounded-2xl"
          />
        }
      >
        <User className="size-4" />
      </Popover.Trigger>
      <Popover.Portal keepMounted>
        <Popover.Positioner
          align="end"
          sideOffset={12}
          collisionPadding={12}
          className="z-50"
        >
          <Popover.Popup
            finalFocus={triggerRef}
            className="w-80 max-w-[calc(100vw-1.5rem)] max-h-[var(--available-height)] overflow-y-auto overscroll-contain rounded-2xl border border-border/70 bg-popover p-4 text-popover-foreground shadow-xl outline-none"
          >
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border/60 pb-3">
              <div>
                <Popover.Title className="text-sm font-semibold">
                  {identity ? "Sua conta" : "Acesse sua conta"}
                </Popover.Title>
                <Popover.Description className="mt-0.5 text-xs text-muted-foreground">
                  {identity
                    ? "Seus dados estão sincronizados com sua conta Finly."
                    : "Entre ou crie seu perfil Finly."}
                </Popover.Description>
              </div>
              <LockKeyhole className="size-4 shrink-0 text-primary" />
            </div>
            <div className="[&_[data-slot=card]]:gap-4 [&_[data-slot=card]]:overflow-visible [&_[data-slot=card]]:rounded-none [&_[data-slot=card]]:border-0 [&_[data-slot=card]]:bg-transparent [&_[data-slot=card]]:p-0 [&_[data-slot=card]]:shadow-none [&_[data-slot=card]]:ring-0 [&_[data-slot=card-header]]:px-0 [&_[data-slot=card-content]]:px-0 [&_[data-slot=card-footer]]:flex-col [&_[data-slot=card-footer]]:items-start [&_[data-slot=card-footer]]:px-0 [&_[data-slot=card-description]]:text-xs [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-ring">
              <AccountAccessContent auth={auth} />
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
