import React from "react";

import { Button } from "@/components/ui/button";

type SocialButtonProps = {
  provider: string;
  icon: React.ReactNode;
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
};

const SocialButton: React.FC<SocialButtonProps> = ({
  provider,
  icon,
  label,
  onClick,
  disabled = false,
}) => {
  return (
    <Button
      type="button"
      aria-label={`Sign in with ${provider}`}
      onClick={onClick}
      disabled={disabled}
      className="my-3 flex w-full items-center justify-center space-x-2 text-lg"
      size="lg"
      variant="outline"
    >
      {icon}
      {label && <span>{label}</span>}
    </Button>
  );
};

export default SocialButton;
