import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { baseApi } from "../../store/api/baseApi";
import KbsLoader from "./KbsLoader";

const GlobalActivityOverlay = () => {
  const apiState = useSelector((state) => state[baseApi.reducerPath]);
  const isBusy = useMemo(() => {
    const queries = Object.values(apiState?.queries || {});
    const mutations = Object.values(apiState?.mutations || {});
    return [...queries, ...mutations].some((entry) => entry?.status === "pending");
  }, [apiState]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (isBusy) {
      timer = setTimeout(() => setVisible(true), 120);
    } else {
      timer = setTimeout(() => setVisible(false), 250);
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
