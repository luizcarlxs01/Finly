import { homeClass } from "./home-styles";

type FinlyMarkProps = {
  className?: string;
};

export function FinlyMark({ className = "" }: FinlyMarkProps) {
  return (
    <span className={`${homeClass("finly-mark")} ${className}`.trim()}>
      <span className={homeClass("finly-mark-symbol")} aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <span>Finly</span>
    </span>
  );
}
