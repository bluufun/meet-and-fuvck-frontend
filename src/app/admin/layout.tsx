import { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <div className='pb-12'>{children}</div>;
}
