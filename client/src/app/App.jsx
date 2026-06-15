import { Outlet } from "react-router-dom";
import { ToastHost } from "../utils/toast";

export default function App() {
  return (
    <>
      <ToastHost />
      <Outlet />
    </>
  );
}
