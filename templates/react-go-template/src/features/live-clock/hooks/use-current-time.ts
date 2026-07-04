import dayjs from "dayjs";
import { useEffect, useState } from "react";

export const useCurrentTime = (): dayjs.Dayjs => {
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const timer = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  return now;
};
