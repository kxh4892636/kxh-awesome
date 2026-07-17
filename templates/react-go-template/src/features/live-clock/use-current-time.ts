import dayjs from "dayjs";
import { useEffect, useState } from "react";

export const useCurrentTime = (): dayjs.Dayjs => {
  const [now, setNow] = useState(dayjs());

  useEffect((): (() => void) => {
    const timer = setInterval((): void => {
      setNow(dayjs());
    }, 1000);

    return (): void => {
      clearInterval(timer);
    };
  }, []);

  return now;
};
