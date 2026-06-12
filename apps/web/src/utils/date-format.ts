const DISPLAY_LOCALE = "pt-BR";
const DISPLAY_TIME_ZONE = "America/Sao_Paulo";

const dateFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  timeZone: DISPLAY_TIME_ZONE,
});

const dateTimeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: DISPLAY_TIME_ZONE,
});

const timeFormatter = new Intl.DateTimeFormat(DISPLAY_LOCALE, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: DISPLAY_TIME_ZONE,
});

const timePartsFormatter = new Intl.DateTimeFormat("en-CA", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: DISPLAY_TIME_ZONE,
});

function parseDateTimeValue(value: string | Date | null | undefined) {
  if (!value) {
    return null;
  }

  const normalizedValue =
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?$/.test(value.trim())
      ? `${value.trim()}Z`
      : value;
  const parsedDate =
    normalizedValue instanceof Date ? normalizedValue : new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

export function isBusinessDateValue(value: string | null | undefined) {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value.trim());
}

export function formatBusinessDateBr(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const trimmedValue = value.trim();
  const match = trimmedValue.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (!match) {
    return null;
  }

  const [, year, month, day] = match;

  return `${day}/${month}/${year}`;
}

export function formatDateBr(value: string | Date | null | undefined) {
  if (typeof value === "string") {
    const businessDate = formatBusinessDateBr(value);

    if (businessDate) {
      return businessDate;
    }
  }

  const parsedDate = parseDateTimeValue(value);

  if (!parsedDate) {
    return null;
  }

  return dateFormatter.format(parsedDate);
}

export function formatDateTimeBr(value: string | Date | null | undefined) {
  const parsedDate = parseDateTimeValue(value);

  if (!parsedDate) {
    return null;
  }

  return dateTimeFormatter.format(parsedDate);
}

export function formatTimeBr(value: string | Date | null | undefined) {
  const parsedDate = parseDateTimeValue(value);

  if (!parsedDate) {
    return null;
  }

  return timeFormatter.format(parsedDate);
}

export function getTimePartsInDisplayZone(
  value: string | Date | null | undefined,
) {
  const parsedDate = parseDateTimeValue(value);

  if (!parsedDate) {
    return null;
  }

  const parts = timePartsFormatter.formatToParts(parsedDate);
  const getPartValue = (type: "hour" | "minute" | "second") =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");

  return {
    hours: getPartValue("hour"),
    minutes: getPartValue("minute"),
    seconds: getPartValue("second"),
  };
}

export function formatDisplayDateTime(
  value: string | null | undefined,
  fallbackDateTime?: string | Date | null,
) {
  if (!value) {
    return null;
  }

  if (!isBusinessDateValue(value)) {
    const formattedValue = formatDateTimeBr(value);

    return formattedValue
      ? {
          value: formattedValue,
          withTime: true,
        }
      : null;
  }

  const formattedDate = formatBusinessDateBr(value);

  if (!formattedDate) {
    return null;
  }

  const fallbackTime = getTimePartsInDisplayZone(fallbackDateTime);

  if (!fallbackTime) {
    return {
      value: formattedDate,
      withTime: false,
    };
  }

  const hasSyntheticMiddayTime =
    fallbackTime.hours === 12 &&
    fallbackTime.minutes === 0 &&
    fallbackTime.seconds === 0;

  if (hasSyntheticMiddayTime) {
    return {
      value: formattedDate,
      withTime: false,
    };
  }

  const formattedTime = formatTimeBr(fallbackDateTime);

  if (!formattedTime) {
    return {
      value: formattedDate,
      withTime: false,
    };
  }

  return {
    value: `${formattedDate}, ${formattedTime}`,
    withTime: true,
  };
}
