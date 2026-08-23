type FinlyMarkProps = {
  className?: string;
};

export function FinlyMark({ className = "" }: FinlyMarkProps) {
  return (
    <span className={`finly-mark ${className}`.trim()}>
      <span className="finly-mark-symbol" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Finly</span>
    </span>
  );
}

