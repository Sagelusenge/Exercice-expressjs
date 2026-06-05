import { useEffect, useMemo, useRef, useState } from "react";
import { useSelector } from "react-redux";
import { baseApi } from "../../store/api/baseApi";
import KbsLoader from "./KbsLoader";

const MIN_VISIBLE_MS = 3000;

const GlobalActivityOverlay = () => {
  const apiState = useSelector((state) => state[baseApi.reducerPath]);
  const isBusy = useMemo(() => {
    const mutations = Object.values(apiState?.mutations || {});
    return mutations.some((entry) => entry?.status === "pending");
  }, [apiState]);
  const [visible, setVisible] = useState(false);
  const startedAtRef = useRef(0);

  useEffect(() => {
    let timer;
    if (isBusy) {
      startedAtRef.current = Date.now();
      timer = setTimeout(() => setVisible(true), 100);
    } else {
      const remaining = Math.max(MIN_VISIBLE_MS - (Date.now() - startedAtRef.current), 0);
      timer = setTimeout(() => setVisible(false), remaining);
    }
    return () => clearTimeout(timer);
  }, [isBusy]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[9999] grid place-items-center bg-surface/65 backdrop-blur-sm">
      <KbsLoader label="Traitement en cours..." />
    </div>
  );
};

export default GlobalActivityOverlay;
